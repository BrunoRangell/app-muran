import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function brazilNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + -3 * 3600000);
}

function fmtDateBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function todayBR(): string {
  const d = brazilNow();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function platformLabel(p: string): string {
  if (p === "meta") return "Meta Ads";
  if (p === "google") return "Google Ads";
  return p;
}

const META_STATUS_PT: Record<string, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  DELETED: "Excluída",
  ARCHIVED: "Arquivada",
  IN_PROCESS: "Em análise",
  WITH_ISSUES: "Com problemas",
  CAMPAIGN_PAUSED: "Campanha pausada",
  ADSET_PAUSED: "Conjunto pausado",
  DISAPPROVED: "Reprovada",
  PENDING_REVIEW: "Em revisão",
  PREAPPROVED: "Pré-aprovada",
  PENDING_BILLING_INFO: "Aguardando faturamento",
};

const GOOGLE_STATUS_PT: Record<string, string> = {
  ENABLED: "Ativa",
  PAUSED: "Pausada",
  REMOVED: "Removida",
  UNKNOWN: "Desconhecido",
  UNSPECIFIED: "Não especificado",
};

const GOOGLE_PRIMARY_STATUS_PT: Record<string, string> = {
  ELIGIBLE: "Veiculando",
  PENDING: "Pendente",
  LEARNING: "Em aprendizado",
  LIMITED: "Limitada",
  MISCONFIGURED: "Configuração inválida",
  NOT_ELIGIBLE: "Não elegível",
  PAUSED: "Pausada",
  REMOVED: "Removida",
  ENDED: "Encerrada",
  UNKNOWN: "Desconhecido",
  UNSPECIFIED: "Não especificado",
};

const GOOGLE_PRIMARY_STATUS_REASON_PT: Record<string, string> = {
  AD_GROUP_ADS_DISAPPROVED: "Todos os anúncios reprovados",
  AD_GROUP_ADS_NOT_ELIGIBLE: "Anúncios não elegíveis",
  AD_GROUPS_PAUSED: "Grupos de anúncios pausados",
  ALL_AD_GROUPS_PAUSED: "Todos os grupos de anúncios pausados",
  AD_GROUPS_REMOVED: "Grupos de anúncios removidos",
  APP_NOT_RELEASED: "App não publicado",
  APP_PARTIALLY_RELEASED: "App parcialmente publicado",
  BIDDING_STRATEGY_CONSTRAINED: "Limitada por estratégia de lance",
  BIDDING_STRATEGY_LIMITED: "Limitada por estratégia de lance",
  BIDDING_STRATEGY_LEARNING: "Estratégia de lance em aprendizado",
  BIDDING_STRATEGY_MISCONFIGURED: "Estratégia de lance mal configurada",
  BUDGET_CONSTRAINED: "Limitada por orçamento",
  BUDGET_MISCONFIGURED: "Orçamento mal configurado",
  CAMPAIGN_DRAFT: "Rascunho de campanha",
  CAMPAIGN_ENDED: "Campanha encerrada",
  CAMPAIGN_PAUSED: "Campanha pausada",
  CAMPAIGN_PENDING: "Campanha pendente",
  CAMPAIGN_REMOVED: "Campanha removida",
  CONVERSION_ACTION_MISSING: "Ação de conversão ausente",
  CONVERSION_TRACKING_MISSING: "Acompanhamento de conversões ausente",
  CUSTOM_GOAL_MISSING: "Meta personalizada ausente",
  HAS_AD_GROUPS_PAUSED: "Há grupos de anúncios pausados",
  HAS_PAUSED_OR_REMOVED_GROUP_CRITERIA: "Há palavras-chave pausadas ou removidas",
  KEYWORDS_PAUSED: "Palavras-chave pausadas",
  LOW_QUALITY_LANDING_PAGE: "Página de destino com baixa qualidade",
  MERCHANT_CENTER_ACCOUNT_SUSPENDED: "Conta do Merchant Center suspensa",
  MISCONFIGURED: "Configuração inválida",
  MOBILE_APP_NO_LONGER_AVAILABLE: "App não disponível",
  NO_ADS: "Sem anúncios",
  NO_AD_GROUPS: "Sem grupos de anúncios",
  NO_ELIGIBLE_AD_GROUPS: "Sem grupos de anúncios elegíveis",
  PAUSED: "Pausada",
  PENDING: "Pendente",
  PENDING_USER_REVIEW: "Aguardando revisão",
  PRODUCT_FEED_HAS_NO_PRODUCTS: "Feed de produtos vazio",
  REMOVED: "Removida",
  STORE_REMOVED: "Loja removida",
  UNKNOWN: "Desconhecido",
  UNSPECIFIED: "Não especificado",
};

const GOOGLE_PROBLEMATIC_STATUSES = new Set(["NOT_ELIGIBLE", "MISCONFIGURED", "PENDING", "ENDED"]);
const GOOGLE_PROBLEMATIC_REASONS = new Set([
  "AD_GROUP_ADS_DISAPPROVED", "AD_GROUP_ADS_NOT_ELIGIBLE", "NO_ADS", "NO_AD_GROUPS",
  "NO_ELIGIBLE_AD_GROUPS", "APP_NOT_RELEASED", "MOBILE_APP_NO_LONGER_AVAILABLE",
  "CONVERSION_ACTION_MISSING", "CONVERSION_TRACKING_MISSING", "LOW_QUALITY_LANDING_PAGE",
  "MERCHANT_CENTER_ACCOUNT_SUSPENDED", "PRODUCT_FEED_HAS_NO_PRODUCTS",
  "BIDDING_STRATEGY_MISCONFIGURED", "BUDGET_MISCONFIGURED", "STORE_REMOVED",
  "CAMPAIGN_REMOVED", "CAMPAIGN_ENDED",
]);

function isGoogleProblematic(c: any): boolean {
  const primary = typeof c?.primary_status === "string" ? c.primary_status : null;
  if (primary && GOOGLE_PROBLEMATIC_STATUSES.has(primary)) return true;
  const reasons = Array.isArray(c?.primary_status_reasons) ? c.primary_status_reasons : [];
  return reasons.some((r: string) => GOOGLE_PROBLEMATIC_REASONS.has(r));
}

function translateStatus(platform: string, status: string): string {
  if (!status) return "Desconhecido";
  const map = platform === "google" ? GOOGLE_STATUS_PT : META_STATUS_PT;
  return map[status] ?? status;
}

function buildGoogleStatusLabel(c: any): string | null {
  const primary = typeof c?.primary_status === "string" ? c.primary_status : null;
  const reasons = Array.isArray(c?.primary_status_reasons) ? c.primary_status_reasons : [];
  if (!primary) return null;
  const base = GOOGLE_PRIMARY_STATUS_PT[primary] ?? primary;
  const reason = reasons.find((r: string) => r && GOOGLE_PRIMARY_STATUS_REASON_PT[r]);
  return reason ? `${base} — ${GOOGLE_PRIMARY_STATUS_REASON_PT[reason]}` : base;
}

// Motivos curtos do Google para o alerta no Discord (priorizar o mais grave)
const GOOGLE_REASON_SHORT_PT: Record<string, string> = {
  AD_GROUP_ADS_DISAPPROVED: "Anúncios reprovados",
  AD_GROUP_ADS_NOT_ELIGIBLE: "Anúncios não elegíveis",
  NO_ADS: "Sem anúncios elegíveis",
  NO_AD_GROUPS: "Sem anúncios elegíveis",
  NO_ELIGIBLE_AD_GROUPS: "Sem anúncios elegíveis",
  CONVERSION_ACTION_MISSING: "Conversões não configuradas",
  CONVERSION_TRACKING_MISSING: "Conversões não configuradas",
  LOW_QUALITY_LANDING_PAGE: "Página de destino baixa qualidade",
  MERCHANT_CENTER_ACCOUNT_SUSPENDED: "Merchant Center suspenso",
  PRODUCT_FEED_HAS_NO_PRODUCTS: "Feed sem produtos",
  BIDDING_STRATEGY_MISCONFIGURED: "Estratégia de lance inválida",
  BUDGET_MISCONFIGURED: "Orçamento inválido",
  APP_NOT_RELEASED: "App indisponível",
  MOBILE_APP_NO_LONGER_AVAILABLE: "App indisponível",
  STORE_REMOVED: "Loja removida",
  CAMPAIGN_REMOVED: "Campanha removida",
  CAMPAIGN_ENDED: "Campanha encerrada",
};

const GOOGLE_STATUS_SHORT_PT: Record<string, string> = {
  NOT_ELIGIBLE: "Não elegível",
  MISCONFIGURED: "Configuração inválida",
  PENDING: "Pendente",
  ENDED: "Encerrada",
};

function buildAlertReason(platform: string, c: any, zeroed2d: boolean): string {
  if (platform === "meta") return "Sem gasto hoje";
  // Google: prioridade 1 — reason problemática mapeada
  const reasons: string[] = Array.isArray(c?.primary_status_reasons) ? c.primary_status_reasons : [];
  for (const r of reasons) {
    if (GOOGLE_REASON_SHORT_PT[r]) return GOOGLE_REASON_SHORT_PT[r];
  }
  // 2 — primary_status problemático
  const primary = typeof c?.primary_status === "string" ? c.primary_status : null;
  if (primary && GOOGLE_STATUS_SHORT_PT[primary]) return GOOGLE_STATUS_SHORT_PT[primary];
  // 3 — somente zerado 2 dias
  if (zeroed2d) return "Sem veiculação (2 dias)";
  return "Sem veiculação";
}

async function sendDiscordMessage(channelId: string, token: string, content: string) {
  return fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content, allowed_mentions: { parse: ["everyone"] } }),
  });
}

async function refreshSnapshots(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  today: string,
): Promise<Record<string, unknown>> {
  const t0 = Date.now();
  // Clientes ativos com contas Meta/Google ativas
  const { data: accounts } = await supabase
    .from("client_accounts")
    .select("client_id, platform, status, account_id, clients!inner(status)")
    .eq("status", "active")
    .neq("account_id", "")
    .not("account_id", "is", null)
    .eq("clients.status", "active");

  const metaSet = new Set<string>();
  const googleSet = new Set<string>();
  for (const a of accounts ?? []) {
    if (a.platform === "meta") metaSet.add(a.client_id);
    else if (a.platform === "google") googleSet.add(a.client_id);
  }
  const metaClientIds = [...metaSet];
  const googleClientIds = [...googleSet];

  const headers = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json",
  };

  const runMeta = metaClientIds.length === 0
    ? Promise.resolve({ ok: true, skipped: true })
    : fetch(`${supabaseUrl}/functions/v1/unified-meta-review`, {
        method: "POST",
        headers,
        body: JSON.stringify({ clientIds: metaClientIds, reviewDate: today, source: "automatic" }),
        signal: AbortSignal.timeout(240000),
      }).then(async (r) => ({ ok: r.ok, status: r.status, body: (await r.text()).slice(0, 300) }))
        .catch((e) => ({ ok: false, error: String(e?.message ?? e) }));

  const runGoogle = googleClientIds.length === 0
    ? Promise.resolve({ ok: true, skipped: true })
    : fetch(`${supabaseUrl}/functions/v1/daily-google-review`, {
        method: "POST",
        headers,
        body: JSON.stringify({ clientIds: googleClientIds, reviewDate: today, source: "automatic" }),
        signal: AbortSignal.timeout(240000),
      }).then(async (r) => ({ ok: r.ok, status: r.status, body: (await r.text()).slice(0, 300) }))
        .catch((e) => ({ ok: false, error: String(e?.message ?? e) }));

  const [metaResult, googleResult] = await Promise.all([runMeta, runGoogle]);
  const summary = {
    duration_ms: Date.now() - t0,
    meta_clients: metaClientIds.length,
    google_clients: googleClientIds.length,
    meta: metaResult,
    google: googleResult,
  };
  await supabase.from("system_logs").insert({
    event_type: "campaign_health_alerts_refresh",
    message: "Refresh de snapshots antes do alerta concluído",
    details: summary,
  });
  return summary;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const discordToken = Deno.env.get("DISCORD_TOKEN");
    const channelId = Deno.env.get("DISCORD_LOW_BALANCE_CHANNEL_ID");

    if (!discordToken || !channelId) {
      return new Response(
        JSON.stringify({ error: "DISCORD_TOKEN ou DISCORD_LOW_BALANCE_CHANNEL_ID não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = todayBR();

    // 1) Atualizar snapshots antes de ler campaign_health
    const refreshSummary = await refreshSnapshots(supabase, supabaseUrl, serviceKey, today);

    // 2) Buscar snapshots de hoje com problemas (Meta + Google)
    const { data: snapshots, error: snapErr } = await supabase
      .from("campaign_health")
      .select("id, client_id, account_id, platform, has_account, active_campaigns_count, unserved_campaigns_count, campaigns_detailed, updated_at")
      .eq("snapshot_date", today)
      .eq("has_account", true)
      .gt("unserved_campaigns_count", 0);

    if (snapErr) throw snapErr;

    // 3) Filtrar snapshots velhos (>30 min) — só consideramos refrescados pelo passo 1
    const FRESH_WINDOW_MS = 30 * 60 * 1000;
    const now = Date.now();
    const staleAccounts: Array<{ account_id: string; updated_at: string | null }> = [];
    const freshSnapshots = (snapshots ?? []).filter((s) => {
      const updatedAt = s.updated_at ? new Date(s.updated_at).getTime() : 0;
      const isFresh = updatedAt > 0 && (now - updatedAt) <= FRESH_WINDOW_MS;
      if (!isFresh) staleAccounts.push({ account_id: s.account_id, updated_at: s.updated_at });
      return isFresh;
    });
    if (staleAccounts.length > 0) {
      await supabase.from("system_logs").insert({
        event_type: "campaign_health_alerts_stale_skip",
        message: `Ignoradas ${staleAccounts.length} contas com snapshot defasado (>30min)`,
        details: { stale_count: staleAccounts.length, stale: staleAccounts.slice(0, 20) },
      });
    }

    if (!freshSnapshots || freshSnapshots.length === 0) {
      await supabase.from("system_logs").insert({
        event_type: "campaign_health_alerts",
        message: "Verificação executada — nenhuma campanha sem veiculação",
        details: { date: today, refresh: refreshSummary, stale_skipped: staleAccounts.length },
      });
      return new Response(JSON.stringify({ ok: true, alerts: 0, checked: 0, stale_skipped: staleAccounts.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIds = [...new Set(freshSnapshots.map((s) => s.client_id))];
    const { data: clients } = await supabase
      .from("clients")
      .select("id, company_name, status")
      .in("id", clientIds);
    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

    type Line = {
      company: string;
      platform: string;
      campaignName: string;
      status: string;
      account_id_uuid: string;
      client_id: string;
    };

    const lines: Line[] = [];
    const accountSummary = new Map<string, { client_id: string; unserved: number; total_active: number }>();

    for (const s of freshSnapshots) {
      const client = clientMap.get(s.client_id);
      if (!client || client.status !== "active") continue;

      accountSummary.set(s.account_id, {
        client_id: s.client_id,
        unserved: Number(s.unserved_campaigns_count ?? 0),
        total_active: Number(s.active_campaigns_count ?? 0),
      });

      const details = Array.isArray(s.campaigns_detailed) ? s.campaigns_detailed : [];
      for (const c of details) {
        // Critério de "sem veiculação":
        //  - Meta: apenas HOJE (cost/impressions === 0)
        //  - Google: janela 2d zerada OU primary_status/reason problemático hoje
        let shouldAlert = false;
        let zeroed2d = false;
        if (s.platform === "meta") {
          const cost = Number(c?.cost ?? 0);
          const impressions = Number(c?.impressions ?? 0);
          shouldAlert = cost === 0 && impressions === 0;
        } else {
          const cost2d = Number(c?.cost_2d ?? c?.cost ?? 0);
          const impr2d = Number(c?.impressions_2d ?? c?.impressions ?? 0);
          zeroed2d = cost2d === 0 && impr2d === 0;
          shouldAlert = zeroed2d || isGoogleProblematic(c);
        }
        if (shouldAlert) {
          lines.push({
            company: client.company_name,
            platform: s.platform,
            campaignName: String(c?.name ?? "Sem nome"),
            status: buildAlertReason(s.platform, c, zeroed2d),
            account_id_uuid: s.account_id,
            client_id: s.client_id,
          });
        }
      }
    }

    if (lines.length === 0) {
      return new Response(JSON.stringify({ ok: true, alerts: 0, checked: freshSnapshots.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ordenar por cliente, depois plataforma, depois nome
    lines.sort((a, b) => {
      const c = a.company.localeCompare(b.company, "pt-BR");
      if (c !== 0) return c;
      const p = a.platform.localeCompare(b.platform);
      if (p !== 0) return p;
      return a.campaignName.localeCompare(b.campaignName, "pt-BR");
    });

    const dateStr = fmtDateBR(brazilNow());
    const header = `# ${dateStr}\n###  :rotating_light: Alerta de campanhas sem veiculação - Meta e Google\n\n`;
    const footer = `\n\n@everyone`;

    const formatted = lines.map(
      (l) => `> • ${l.company} | ${platformLabel(l.platform)} | ${l.campaignName} — Motivo: ${l.status}`,
    );

    // Chunking <1700 chars
    const chunks: string[] = [];
    let current = "";
    for (const line of formatted) {
      if ((current.length + line.length + 1) > 1700) {
        chunks.push(current);
        current = "";
      }
      current += (current ? "\n" : "") + line;
    }
    if (current) chunks.push(current);

    let firstMessageId: string | null = null;
    for (let i = 0; i < chunks.length; i++) {
      const isFirst = i === 0;
      const isLast = i === chunks.length - 1;
      const content = (isFirst ? header : "") + chunks[i] + (isLast ? footer : "");
      const resp = await sendDiscordMessage(channelId, discordToken, content);
      const body = await resp.text();
      if (!resp.ok) {
        await supabase.from("system_logs").insert({
          event_type: "campaign_health_alerts_error",
          message: "Falha ao enviar alerta no Discord",
          details: { status: resp.status, body: body.slice(0, 500), chunk: i },
        });
        return new Response(
          JSON.stringify({ error: "Discord API error", status: resp.status, body }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (isFirst) {
        try { firstMessageId = JSON.parse(body).id ?? null; } catch (_) {}
      }
    }

    // Histórico: insere uma linha por conta alertada (ignora conflitos com unique constraint)
    const rows = Array.from(accountSummary.entries()).map(([account_id, s]) => ({
      account_id,
      client_id: s.client_id,
      snapshot_date: today,
      unserved_count: s.unserved,
      total_active: s.total_active,
      discord_message_id: firstMessageId,
    }));
    if (rows.length > 0) {
      await supabase.from("campaign_health_alerts").upsert(rows, { onConflict: "account_id,snapshot_date", ignoreDuplicates: false });
    }

    await supabase.from("system_logs").insert({
      event_type: "campaign_health_alerts",
      message: `Enviados ${lines.length} alertas de campanhas sem veiculação`,
      details: { campaigns: lines.length, accounts: rows.length, checked: freshSnapshots.length, message_id: firstMessageId, chunks: chunks.length },
    });

    return new Response(
      JSON.stringify({ ok: true, campaigns: lines.length, accounts: rows.length, checked: freshSnapshots.length, message_id: firstMessageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-campaign-health-alerts error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
