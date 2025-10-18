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

// Helper → sempre garantir act_ prefixado
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

// ======================== FETCH PIXELS ========================
async function fetchPixels(accountId: string, accessToken: string) {
  const actId = withActPrefix(accountId);
  const url = `${GRAPH_API_BASE}/${actId}/adspixels?fields=id,name&access_token=${accessToken}`;
  console.log("[PIXEL] 🔍", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Erro ao buscar pixels");
    console.log(`[PIXEL] ✅ ${data.data?.length || 0} encontrados`);
    return data.data || [];
  } catch (err: any) {
    console.error("[PIXEL] ❌ Erro Graph:", err.message);
    return [];
  }
}

// ======================== FETCH INSTAGRAM ========================
async function fetchInstagramAccounts(accountId: string, accessToken: string) {
  const actId = withActPrefix(accountId);
  console.log("[IG] 🔍 Buscando IG vinculados a", actId);

  try {
    // 1️⃣ tentar via conta de anúncios
    const direct = await fetch(
      `${GRAPH_API_BASE}/${actId}?fields=instagram_accounts{username,id,name}&access_token=${accessToken}`,
    );
    const directData = await direct.json();
    if (direct.ok && directData.instagram_accounts?.data?.length) {
      console.log(`[IG] ✅ Direto: ${directData.instagram_accounts.data.length}`);
      return directData.instagram_accounts.data;
    }

    // 2️⃣ tentar via business
    const business = await fetch(`${GRAPH_API_BASE}/${actId}?fields=business&access_token=${accessToken}`);
    const businessData = await business.json();
    const businessId = businessData.business?.id;
    if (!businessId) {
      console.warn("[IG] ⚠️ Nenhum business vinculado.");
      return [];
    }

    const ig = await fetch(
      `${GRAPH_API_BASE}/${businessId}/instagram_accounts?fields=id,username,name&access_token=${accessToken}`,
    );
    const igData = await ig.json();
    if (!ig.ok) throw new Error(igData.error?.message || "Erro no IG Business");
    console.log(`[IG] ✅ via Business: ${igData.data?.length || 0}`);
    return igData.data || [];
  } catch (err: any) {
    console.error("[IG] ❌ Erro Graph:", err.message);
    return [];
  }
}

// ======================== FETCH FACEBOOK PAGES ========================
async function fetchFacebookPages(accountId: string, accessToken: string) {
  const actId = withActPrefix(accountId);
  console.log("[FB] 🔍 Buscando páginas vinculadas a", actId);

  try {
    const business = await fetch(`${GRAPH_API_BASE}/${actId}?fields=business&access_token=${accessToken}`);
    const businessData = await business.json();
    const businessId = businessData.business?.id;
    if (!businessId) {
      console.warn("[FB] ⚠️ Nenhum business vinculado.");
      return [];
    }

    const pages = await fetch(
      `${GRAPH_API_BASE}/${businessId}?fields=owned_pages{id,name,link,picture,fan_count}&access_token=${accessToken}`,
    );
    const pagesData = await pages.json();
    if (!pages.ok) throw new Error(pagesData.error?.message || "Erro no FB Pages");
    console.log(`[FB] ✅ ${pagesData.owned_pages?.data?.length || 0} páginas`);
    return pagesData.owned_pages?.data || [];
  } catch (err: any) {
    console.error("[FB] ❌ Erro Graph:", err.message);
    return [];
  }
}

// ======================== CREATE SITE AUDIENCE ========================
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

// ======================== CREATE ENGAGEMENT AUDIENCE ========================
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

  const sourceTypeKey = sourceType === "instagram" ? "ig_business" : "page";

  // ✅ Instagram: SEM filter | Facebook: COM filter (page_engaged)
  const rule = sourceType === "instagram" 
    ? {
        inclusions: {
          operator: "or",
          rules: [
            {
              event_sources: [{ type: sourceTypeKey, id: sourceId }],
              retention_seconds: retentionDays * 86400,
            },
          ],
        },
      }
    : {
        inclusions: {
          operator: "or",
          rules: [
            {
              event_sources: [{ type: sourceTypeKey, id: sourceId }],
              retention_seconds: retentionDays * 86400,
              filter: {
                operator: "and",
                filters: [{ field: "event", operator: "eq", value: "page_engaged" }],
              },
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

  console.log(`[AUDIENCE] 🚀 Criando: ${audienceName} | Source: ${sourceId} | Type: ${sourceTypeKey}`);

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

  console.log(`[AUDIENCE] ✅ Público criado: ${audienceName} (ID: ${data.id})`);
  return data;
}

// ======================== MAIN SERVER HANDLER ========================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const requestData: CreateAudienceRequest = await req.json();
    const { action, accountId } = requestData;

    const accessToken = await getMetaAccessToken(supabase);

    // === PIXELS ===
    if (action === "fetch_pixels") {
      const pixels = await fetchPixels(accountId!, accessToken);
      return new Response(JSON.stringify({ success: true, pixels }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === INSTAGRAM ===
    if (action === "fetch_instagram_accounts") {
      const accounts = await fetchInstagramAccounts(accountId!, accessToken);
      return new Response(JSON.stringify({ success: true, accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === FACEBOOK ===
    if (action === "fetch_facebook_pages") {
      const pages = await fetchFacebookPages(accountId!, accessToken);
      return new Response(JSON.stringify({ success: true, pages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CRIAR PÚBLICOS ===
    if (action === "create_audiences" || action === "create_unified_audiences") {
      const { audienceType, pixelId, eventTypes, siteEvents, instagramAccountId, facebookPageId, engagementTypes } =
        requestData;
      const results: any[] = [];
      const siteDays = [7, 14, 30, 60, 90, 180];
      const engageDays = [7, 14, 30, 60, 90, 180, 365, 730];

      console.log("[UNIFIED] 📥 Payload:", {
        accountId,
        siteEvents: siteEvents?.length || 0,
        engagementTypes,
        instagramAccountId,
        facebookPageId,
      });

      // 🎯 SITE AUDIENCES
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

      // 🎯 ENGAGEMENT AUDIENCES
      if ((audienceType === "engagement" || action === "create_unified_audiences") && engagementTypes?.length) {
        for (const type of engagementTypes) {
          const sourceId = type === "instagram" ? instagramAccountId : facebookPageId;
          if (!sourceId) {
            console.warn(`[UNIFIED] ⚠️ ${type} selecionado mas sem ID configurado`);
            continue;
          }

          console.log(`[UNIFIED] 🎯 Criando públicos ${type.toUpperCase()} com source: ${sourceId}`);

          for (const d of engageDays) {
            try {
              const res = await createEngagementAudience(
                accountId!,
                sourceId,
                type as "instagram" | "facebook",
                d,
                accessToken,
              );
              const prefix = type === "instagram" ? "IG" : "FB";
              results.push({ name: `[${prefix}] Envolvidos - ${d}D`, status: "success", id: res.id });
            } catch (err: any) {
              console.error(`[UNIFIED] ❌ Falha ${type} ${d}D:`, err.message);
              const prefix = type === "instagram" ? "IG" : "FB";
              results.push({
                name: `[${prefix}] Envolvidos - ${d}D`,
                status: "failed",
                error: err.message,
              });
            }
          }
        }
      }

      const created = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "failed").length;

      console.log(`[UNIFIED] ✅ Resumo: ${created} criados | ${failed} falharam`);

      return new Response(
        JSON.stringify({
          success: true,
          created,
          failed,
          audiences: results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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
