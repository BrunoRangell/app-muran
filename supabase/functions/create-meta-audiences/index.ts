import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const GRAPH_API_VERSION = "v24.0";
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

// =======================================================
// 🔧 Helper: garantir prefixo act_
// =======================================================
function withActPrefix(accountId: string): string {
  if (!accountId) return "";
  return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
}

// =======================================================
// 🔐 Buscar token Meta no Supabase
// =======================================================
async function getMetaAccessToken(supabase: any): Promise<string> {
  const { data, error } = await supabase.from("api_tokens").select("value").eq("name", "meta_access_token").single();

  if (error || !data) throw new Error("Token Meta Ads não encontrado no banco");
  return data.value;
}

// =======================================================
// 📊 Buscar Pixels
// =======================================================
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

// =======================================================
// 📸 Buscar Contas do Instagram
// =======================================================
async function fetchInstagramAccounts(accountId: string, accessToken: string) {
  const actId = withActPrefix(accountId);
  console.log("[IG] 🔍 Buscando IG vinculados a", actId);

  try {
    const direct = await fetch(
      `${GRAPH_API_BASE}/${actId}?fields=instagram_accounts{username,id,name}&access_token=${accessToken}`,
    );
    const directData = await direct.json();
    if (direct.ok && directData.instagram_accounts?.data?.length) {
      console.log(`[IG] ✅ Direto: ${directData.instagram_accounts.data.length}`);
      return directData.instagram_accounts.data;
    }

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

// =======================================================
// 📘 Buscar Páginas do Facebook
// =======================================================
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

// =======================================================
// 🌐 Criar Públicos de Site
// =======================================================
async function createSiteAudience(
  accountId: string,
  pixelId: string,
  eventType: string,
  retentionDays: number,
  accessToken: string,
) {
  const actId = withActPrefix(accountId);
  const audienceName = `SITE_${eventType}_${retentionDays}D`;

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

  const formData = new FormData();
  formData.append("name", audienceName);
  formData.append("subtype", "WEBSITE");
  formData.append("rule", JSON.stringify(rule));
  formData.append("access_token", accessToken);

  const url = `${GRAPH_API_BASE}/${actId}/customaudiences`;
  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    console.error("[AUDIENCE] ❌ Erro ao criar público de site:", data.error?.message);
    throw new Error(data.error?.message || "Erro ao criar público");
  }

  console.log(`[AUDIENCE] ✅ Público criado: ${audienceName}`);
  return data;
}

// =======================================================
// 🤝 Criar Públicos de Engajamento (Instagram + Facebook)
// =======================================================
async function createEngagementAudience(
  accountId: string,
  sourceId: string,
  sourceType: "instagram" | "facebook",
  retentionDays: number,
  accessToken: string,
) {
  const actId = withActPrefix(accountId);
  const audienceName = `${sourceType === "instagram" ? "IG" : "FB"}_Envolvidos_${retentionDays}D`;
  const retentionSeconds = retentionDays * 86400;

  const rule =
    sourceType === "instagram"
      ? {
          inclusions: {
            operator: "or",
            rules: [
              {
                event_sources: [{ id: sourceId, type: "ig_business" }],
                retention_seconds: retentionSeconds,
                filter: {
                  operator: "and",
                  filters: [
                    {
                      field: "event",
                      operator: "eq",
                      value: "ig_business_profile_all",
                    },
                  ],
                },
              },
            ],
          },
        }
      : {
          inclusions: {
            operator: "or",
            rules: [
              {
                event_sources: [{ id: sourceId, type: "page" }],
                retention_seconds: retentionSeconds,
                filter: {
                  operator: "and",
                  filters: [
                    {
                      field: "event",
                      operator: "eq",
                      value: "page_engaged",
                    },
                  ],
                },
              },
            ],
          },
        };

  console.log(`[AUDIENCE] 🚀 Criando público ${audienceName}`, { sourceType, rule });

  const formData = new FormData();
  formData.append("name", audienceName);
  formData.append("subtype", "ENGAGEMENT");
  formData.append("rule", JSON.stringify(rule));
  formData.append("prefill", "1");
  formData.append("access_token", accessToken);

  const url = `${GRAPH_API_BASE}/${actId}/customaudiences`;
  const res = await fetch(url, { method: "POST", body: formData });
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error(`[AUDIENCE] ❌ Erro ${sourceType.toUpperCase()}:`, {
      status: res.status,
      body: text,
      sent: { name: audienceName, rule },
    });
    throw new Error(data.error?.message || "Erro ao criar público");
  }

  console.log(`[AUDIENCE] ✅ Criado com sucesso: ${audienceName}`, data);
  return data;
}

// =======================================================
// 🧠 MAIN HANDLER
// =======================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const requestData: CreateAudienceRequest = await req.json();
    const { action, accountId } = requestData;
    const accessToken = await getMetaAccessToken(supabase);

    // === FETCH ===
    if (action === "fetch_pixels")
      return new Response(JSON.stringify({ success: true, pixels: await fetchPixels(accountId!, accessToken) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (action === "fetch_instagram_accounts")
      return new Response(
        JSON.stringify({ success: true, accounts: await fetchInstagramAccounts(accountId!, accessToken) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

    if (action === "fetch_facebook_pages")
      return new Response(JSON.stringify({ success: true, pages: await fetchFacebookPages(accountId!, accessToken) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // === CREATE ===
    if (action === "create_audiences" || action === "create_unified_audiences") {
      const { audienceType, pixelId, eventTypes, siteEvents, instagramAccountId, facebookPageId, engagementTypes } =
        requestData;

      const results: any[] = [];
      const siteDays = [7, 14, 30, 60, 90, 180];
      const engageDays = [7, 14, 30, 60, 90, 180, 365, 730];

      console.log("[UNIFIED] 📥 Payload recebido:", {
        accountId,
        instagramAccountId,
        facebookPageId,
        engagementTypes,
        siteEvents,
      });

      // SITE AUDIENCES
      if ((audienceType === "site" || action === "create_unified_audiences") && pixelId) {
        for (const event of eventTypes || siteEvents || []) {
          for (const d of siteDays) {
            try {
              const res = await createSiteAudience(accountId!, pixelId, event, d, accessToken);
              results.push({ name: `SITE_${event}_${d}D`, status: "success", id: res.id });
            } catch (err: any) {
              results.push({ name: `SITE_${event}_${d}D`, status: "failed", error: err.message });
            }
          }
        }
      }

      // ENGAGEMENT AUDIENCES
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
              results.push({ name: `${type.toUpperCase()}_Envolvidos_${d}D`, status: "success", id: res.id });
            } catch (err: any) {
              results.push({
                name: `${type.toUpperCase()}_Envolvidos_${d}D`,
                status: "failed",
                error: err.message,
              });
            }
          }
        }
      }

      const created = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "failed").length;

      console.log(`[UNIFIED] ✅ Finalizado: ${created} criados | ${failed} falharam`);
      return new Response(JSON.stringify({ success: true, created, failed, audiences: results }), {
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
