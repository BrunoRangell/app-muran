import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const GRAPH_API_VERSION = "v23.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface CreateAudienceRequest {
  action:
    | "fetch_accounts"
    | "fetch_pixels"
    | "fetch_instagram_accounts"
    | "fetch_facebook_pages"
    | "create_audiences"
    | "create_unified_audiences";
  accountId?: string;
  audienceType?: "site" | "engagement";
  pixelId?: string;
  eventTypes?: string[];
  siteEvents?: string[];
  instagramAccountId?: string;
  facebookPageId?: string;
  engagementTypes?: string[];
  debugToken?: string;
}

// Força o formato com act_
function withActPrefix(accountId: string): string {
  if (!accountId) return "";
  return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
}

// Buscar token Meta no Supabase
async function getMetaAccessToken(supabase: any): Promise<string> {
  const { data, error } = await supabase.from("api_tokens").select("value").eq("name", "meta_access_token").single();

  if (error || !data) throw new Error("Token Meta Ads não encontrado no banco");
  return data.value;
}

// Buscar Pixels
async function fetchPixels(accountId: string, accessToken: string) {
  const url = `${GRAPH_API_BASE}/${withActPrefix(accountId)}/adspixels?fields=id,name&access_token=${accessToken}`;
  console.log("[PIXEL] 🔍 Buscando pixels:", url);
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("[PIXEL] ❌ Erro:", data.error?.message);
    throw new Error(data.error?.message || "Erro ao buscar pixels");
  }

  console.log(`[PIXEL] ✅ ${data.data?.length || 0} pixels encontrados`);
  return data.data || [];
}

// Buscar perfis do Instagram vinculados
async function fetchInstagramAccounts(accountId: string, accessToken: string) {
  const actId = withActPrefix(accountId);
  console.log("[IG] 🔍 Buscando perfis vinculados a:", actId);

  // 1️⃣ Buscar diretamente na conta de anúncios
  const directUrl = `${GRAPH_API_BASE}/${actId}?fields=instagram_accounts{username,id,name,profile_pic}&access_token=${accessToken}`;
  const directRes = await fetch(directUrl);
  const directData = await directRes.json();

  if (directData.instagram_accounts?.data?.length > 0) {
    console.log(`[IG] ✅ Perfis diretos encontrados: ${directData.instagram_accounts.data.length}`);
    return directData.instagram_accounts.data;
  }

  // 2️⃣ Buscar via business vinculado
  const businessUrl = `${GRAPH_API_BASE}/${actId}?fields=business&access_token=${accessToken}`;
  const businessRes = await fetch(businessUrl);
  const businessData = await businessRes.json();
  const businessId = businessData.business?.id;

  if (!businessId) {
    console.warn("[IG] ⚠️ Nenhum business vinculado encontrado.");
    return [];
  }

  const igUrl = `${GRAPH_API_BASE}/${businessId}/instagram_accounts?fields=id,username,name,profile_pic&access_token=${accessToken}`;
  const igRes = await fetch(igUrl);
  const igData = await igRes.json();

  if (!igRes.ok) throw new Error(igData.error?.message || "Erro ao buscar perfis do Instagram");
  console.log(`[IG] ✅ Perfis via business: ${igData.data?.length || 0}`);
  return igData.data || [];
}

// Buscar páginas do Facebook
async function fetchFacebookPages(accountId: string, accessToken: string) {
  const actId = withActPrefix(accountId);
  console.log("[FB] 🔍 Buscando páginas vinculadas à conta:", actId);

  // Buscar business vinculado
  const businessUrl = `${GRAPH_API_BASE}/${actId}?fields=business&access_token=${accessToken}`;
  const businessRes = await fetch(businessUrl);
  const businessData = await businessRes.json();
  const businessId = businessData.business?.id;

  if (!businessId) {
    console.warn("[FB] ⚠️ Nenhum business vinculado à conta.");
    return [];
  }

  const pagesUrl = `${GRAPH_API_BASE}/${businessId}?fields=owned_pages{id,name,link,picture,fan_count}&access_token=${accessToken}`;
  const pagesRes = await fetch(pagesUrl);
  const pagesData = await pagesRes.json();

  if (!pagesRes.ok) throw new Error(pagesData.error?.message || "Erro ao buscar páginas");
  console.log(`[FB] ✅ ${pagesData.owned_pages?.data?.length || 0} páginas encontradas`);
  return pagesData.owned_pages?.data || [];
}

// Criar público de site
async function createSiteAudience(
  accountId: string,
  pixelId: string,
  eventType: string,
  retentionDays: number,
  accessToken: string,
) {
  const actId = withActPrefix(accountId);
  const audienceName = `[SITE] ${eventType} - ${retentionDays}D`;

  const rule = {
    inclusions: {
      operator: "or",
      rules: [
        {
          event_sources: [{ id: pixelId, type: "pixel" }],
          retention_seconds: retentionDays * 86400,
          filter: { operator: "and", filters: [{ field: "event", operator: "eq", value: eventType }] },
        },
      ],
    },
  };

  const url = `${GRAPH_API_BASE}/${actId}/customaudiences`;
  const body = new URLSearchParams({
    name: audienceName,
    subtype: "WEBSITE",
    rule: JSON.stringify(rule),
    access_token: accessToken,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();

  if (!res.ok) {
    console.error("[AUDIENCE] ❌ Erro ao criar público de site:", data.error?.message);
    throw new Error(data.error?.message || "Erro ao criar público");
  }

  console.log(`[AUDIENCE] ✅ Público criado: ${audienceName}`);
  return data;
}

// Criar público de engajamento
async function createEngagementAudience(
  accountId: string,
  sourceId: string,
  sourceType: "instagram" | "facebook",
  retentionDays: number,
  accessToken: string,
) {
  const actId = withActPrefix(accountId);
  const audienceName =
    sourceType === "instagram" ? `[IG] Envolvidos - ${retentionDays}D` : `[FB] Envolvidos - ${retentionDays}D`;

  const rule = {
    inclusions: {
      operator: "or",
      rules: [
        {
          event_sources: [{ id: sourceId, type: sourceType === "instagram" ? "instagram_account" : "page" }],
          retention_seconds: retentionDays * 86400,
          filter: { operator: "or", filters: [{ field: "event", operator: "eq", value: "page_engaged" }] },
        },
      ],
    },
  };

  const url = `${GRAPH_API_BASE}/${actId}/customaudiences`;
  const body = new URLSearchParams({
    name: audienceName,
    subtype: "ENGAGEMENT",
    rule: JSON.stringify(rule),
    access_token: accessToken,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();

  if (!res.ok) {
    console.error("[AUDIENCE] ❌ Erro ao criar público de engajamento:", data.error?.message);
    throw new Error(data.error?.message || "Erro ao criar público");
  }

  console.log(`[AUDIENCE] ✅ Público criado: ${audienceName}`);
  return data;
}

// ========================= SERVER HANDLER =========================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const requestData: CreateAudienceRequest = await req.json();
    const { action, accountId } = requestData;

    const accessToken = await getMetaAccessToken(supabase);

    // ===== Pixels =====
    if (action === "fetch_pixels") {
      const pixels = await fetchPixels(accountId!, accessToken);
      return new Response(JSON.stringify({ success: true, pixels }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Instagram =====
    if (action === "fetch_instagram_accounts") {
      const accounts = await fetchInstagramAccounts(accountId!, accessToken);
      return new Response(JSON.stringify({ success: true, accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Facebook =====
    if (action === "fetch_facebook_pages") {
      const pages = await fetchFacebookPages(accountId!, accessToken);
      return new Response(JSON.stringify({ success: true, pages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Criação de Públicos =====
    if (action === "create_audiences" || action === "create_unified_audiences") {
      const { audienceType, pixelId, eventTypes, siteEvents, instagramAccountId, facebookPageId, engagementTypes } =
        requestData;
      const results: any[] = [];
      const siteDays = [7, 14, 30, 60, 90, 180];
      const engageDays = [7, 14, 30, 60, 90, 180, 365, 730];

      if ((audienceType === "site" || action === "create_unified_audiences") && pixelId && (eventTypes || siteEvents)) {
        for (const event of eventTypes || siteEvents || []) {
          for (const d of siteDays) {
            try {
              const res = await createSiteAudience(accountId!, pixelId, event, d, accessToken);
              results.push({ name: `[SITE] ${event} - ${d}D`, status: "success", id: res.id });
            } catch (err: any) {
              results.push({ name: `[SITE] ${event} - ${d}D`, status: "failed", error: err.message });
            }
          }
        }
      }

      if ((audienceType === "engagement" || action === "create_unified_audiences") && engagementTypes?.length) {
        for (const type of engagementTypes) {
          const sourceId = type === "instagram" ? instagramAccountId : facebookPageId;
          if (!sourceId) continue;
          for (const d of engageDays) {
            try {
              const res = await createEngagementAudience(
                accountId!,
                sourceId,
                type as "instagram" | "facebook",
                d,
                accessToken,
              );
              results.push({ name: `[${type.toUpperCase()}] Envolvidos - ${d}D`, status: "success", id: res.id });
            } catch (err: any) {
              results.push({
                name: `[${type.toUpperCase()}] Envolvidos - ${d}D`,
                status: "failed",
                error: err.message,
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");
  } catch (err: any) {
    console.error("[create-meta-audiences] ❌ Erro geral:", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
