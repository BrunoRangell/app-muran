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

// Normalizar ID (remove "act_" duplicado)
function normalizeAccountId(accountId: string): string {
  if (!accountId) return "";
  let normalized = accountId.trim();
  while (normalized.startsWith("act_")) {
    normalized = normalized.substring(4);
  }
  return normalized;
}

// Buscar token Meta salvo no banco
async function getMetaAccessToken(supabase: any): Promise<string> {
  const { data, error } = await supabase.from("api_tokens").select("value").eq("name", "meta_access_token").single();

  if (error || !data) {
    throw new Error("Token Meta Ads não encontrado no banco de dados");
  }

  return data.value;
}

// Buscar Pixels
async function fetchPixels(accountId: string, accessToken: string) {
  const url = `${GRAPH_API_BASE}/${accountId}/adspixels?fields=id,name&access_token=${accessToken}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Erro ao buscar pixels");
  }

  return data.data || [];
}

// Buscar perfis Instagram vinculados
async function fetchInstagramAccounts(accountId: string, accessToken: string) {
  console.log("[IG] 🔍 Buscando perfis do Instagram vinculados à conta:", accountId);

  // 1️⃣ Primeiro, tentar buscar direto na conta de anúncios
  const directUrl = `${GRAPH_API_BASE}/act_${accountId}?fields=instagram_accounts{username,id,name,profile_pic}&access_token=${accessToken}`;
  const directRes = await fetch(directUrl);
  const directData = await directRes.json();

  if (directData.instagram_accounts?.data?.length > 0) {
    console.log(`[IG] ✅ Perfis encontrados diretamente: ${directData.instagram_accounts.data.length}`);
    return directData.instagram_accounts.data;
  }

  // 2️⃣ Se não houver resultado, tentar via business vinculado
  const businessUrl = `${GRAPH_API_BASE}/act_${accountId}?fields=business&access_token=${accessToken}`;
  const businessRes = await fetch(businessUrl);
  const businessData = await businessRes.json();
  const businessId = businessData.business?.id;

  if (!businessId) {
    console.warn("[IG] ⚠️ Nenhum business vinculado e nenhum perfil encontrado.");
    return [];
  }

  const igUrl = `${GRAPH_API_BASE}/${businessId}/instagram_accounts?fields=id,username,name,profile_pic&access_token=${accessToken}`;
  const igRes = await fetch(igUrl);
  const igData = await igRes.json();

  if (!igRes.ok) throw new Error(igData.error?.message || "Erro ao buscar perfis do Instagram");
  console.log(`[IG] ✅ Perfis encontrados via business: ${igData.data?.length || 0}`);
  return igData.data || [];
}

// Buscar páginas do Facebook vinculadas
async function fetchFacebookPages(accountId: string, accessToken: string) {
  console.log("[FB] 🔍 Buscando páginas vinculadas à conta:", accountId);

  // 1️⃣ Buscar o Business vinculado
  const businessUrl = `${GRAPH_API_BASE}/act_${accountId}?fields=business&access_token=${accessToken}`;
  const businessRes = await fetch(businessUrl);
  const businessData = await businessRes.json();

  const businessId = businessData.business?.id;
  if (!businessId) {
    console.warn("[FB] ⚠️ Nenhum business vinculado à conta de anúncios.");
    return [];
  }

  // 2️⃣ Buscar páginas do Business
  const pagesUrl = `${GRAPH_API_BASE}/${businessId}?fields=owned_pages{id,name,link,picture,fan_count}&access_token=${accessToken}`;
  const pagesRes = await fetch(pagesUrl);
  const pagesData = await pagesRes.json();

  if (!pagesRes.ok) throw new Error(pagesData.error?.message || "Erro ao buscar páginas do Facebook");
  console.log(`[FB] ✅ Páginas encontradas: ${pagesData.owned_pages?.data?.length || 0}`);
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
  const audienceName = `[SITE] ${eventType} - ${retentionDays}D`;

  const rule = {
    inclusions: {
      operator: "or",
      rules: [
        {
          event_sources: [{ id: pixelId, type: "pixel" }],
          retention_seconds: retentionDays * 86400,
          filter: {
            operator: "and",
            filters: [{ field: "event", operator: "eq", value: eventType }],
          },
        },
      ],
    },
  };

  const url = `${GRAPH_API_BASE}/${accountId}/customaudiences`;
  const body = new URLSearchParams({
    name: audienceName,
    subtype: "WEBSITE",
    rule: JSON.stringify(rule),
    access_token: accessToken,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erro ao criar público de site");
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
  const audienceName =
    sourceType === "instagram" ? `[IG] Envolvidos - ${retentionDays}D` : `[FB] Envolvidos - ${retentionDays}D`;

  const rule = {
    inclusions: {
      operator: "or",
      rules: [
        {
          event_sources: [
            {
              id: sourceId,
              type: sourceType === "instagram" ? "instagram_account" : "page",
            },
          ],
          retention_seconds: retentionDays * 86400,
          filter: {
            operator: "or",
            filters: [{ field: "event", operator: "eq", value: "page_engaged" }],
          },
        },
      ],
    },
  };

  const url = `${GRAPH_API_BASE}/${accountId}/customaudiences`;
  const body = new URLSearchParams({
    name: audienceName,
    subtype: "ENGAGEMENT",
    rule: JSON.stringify(rule),
    access_token: accessToken,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erro ao criar público de engajamento");
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: CreateAudienceRequest = await req.json();
    const { action, accountId } = requestData;

    const accessToken = await getMetaAccessToken(supabase);

    if (action === "fetch_pixels") {
      const pixels = await fetchPixels(normalizeAccountId(accountId!), accessToken);
      return new Response(JSON.stringify({ success: true, pixels }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fetch_instagram_accounts") {
      const accounts = await fetchInstagramAccounts(normalizeAccountId(accountId!), accessToken);
      return new Response(JSON.stringify({ success: true, accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fetch_facebook_pages") {
      const pages = await fetchFacebookPages(normalizeAccountId(accountId!), accessToken);
      return new Response(JSON.stringify({ success: true, pages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🧠 Criação de públicos (site + engajamento)
    if (action === "create_audiences" || action === "create_unified_audiences") {
      const { audienceType, pixelId, eventTypes, siteEvents, instagramAccountId, facebookPageId, engagementTypes } =
        requestData;

      const results: any[] = [];
      const siteRetentionDays = [7, 14, 30, 60, 90, 180];
      const engagementRetentionDays = [7, 14, 30, 60, 90, 180, 365, 730];

      if (audienceType === "site" && pixelId && eventTypes?.length) {
        for (const event of eventTypes) {
          for (const days of siteRetentionDays) {
            try {
              const res = await createSiteAudience(accountId!, pixelId, event, days, accessToken);
              results.push({ name: `[SITE] ${event} - ${days}D`, status: "success", id: res.id });
            } catch (err: any) {
              results.push({ name: `[SITE] ${event} - ${days}D`, status: "failed", error: err.message });
            }
          }
        }
      }

      if (audienceType === "engagement" && engagementTypes?.length) {
        for (const type of engagementTypes) {
          for (const days of engagementRetentionDays) {
            try {
              const sourceId = type === "instagram" ? instagramAccountId : facebookPageId;
              if (!sourceId) continue;
              const res = await createEngagementAudience(
                accountId!,
                sourceId,
                type === "instagram" ? "instagram" : "facebook",
                days,
                accessToken,
              );
              results.push({
                name: type === "instagram" ? `[IG] Envolvidos - ${days}D` : `[FB] Envolvidos - ${days}D`,
                status: "success",
                id: res.id,
              });
            } catch (err: any) {
              results.push({
                name: type === "instagram" ? `[IG] Envolvidos - ${days}D` : `[FB] Envolvidos - ${days}D`,
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

    throw new Error("Ação inválida.");
  } catch (error: any) {
    console.error("[create-meta-audiences] ❌ Erro:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
