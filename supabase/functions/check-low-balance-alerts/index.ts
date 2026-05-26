import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THRESHOLD_DAYS = 3;
const DEDUP_WINDOW_HOURS = 11;

type Level = "esgotado" | "critico" | "baixo";

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// Codifica nível como número em dias_restantes para deduplicação:
// esgotado = -1, critico = dias real (<=1), baixo = dias real (<=3)
function levelRank(level: Level): number {
  if (level === "esgotado") return 0;
  if (level === "critico") return 1;
  return 2;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const discordToken = Deno.env.get("DISCORD_TOKEN");
    const channelId = Deno.env.get("DISCORD_LOW_BALANCE_CHANNEL_ID");

    console.log("[check-low-balance-alerts] secrets presentes:", {
      DISCORD_TOKEN: !!discordToken,
      DISCORD_LOW_BALANCE_CHANNEL_ID: !!channelId,
    });

    if (!discordToken || !channelId) {
      return new Response(
        JSON.stringify({
          error: "DISCORD_TOKEN ou DISCORD_LOW_BALANCE_CHANNEL_ID não configurado",
          has_token: !!discordToken,
          has_channel: !!channelId,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Contas Meta pré-pagas ativas com saldo (inclusive zero/negativo)
    const { data: accounts, error: accErr } = await supabase
      .from("client_accounts")
      .select("id, client_id, account_id, account_name, saldo_restante, is_prepay_account, is_primary")
      .eq("platform", "meta")
      .eq("status", "active")
      .eq("is_prepay_account", true)
      .not("saldo_restante", "is", null);

    if (accErr) throw accErr;

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "Nenhuma conta pré-paga ativa" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIds = [...new Set(accounts.map((a) => a.client_id))];
    const accountIds = accounts.map((a) => a.id);

    // 2. Clientes ativos
    const { data: clients } = await supabase
      .from("clients")
      .select("id, company_name, status")
      .in("id", clientIds)
      .eq("status", "active");

    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

    // 3. Última review por conta (daily_budget_current)
    const { data: reviews } = await supabase
      .from("budget_reviews")
      .select("account_id, daily_budget_current, review_date, created_at")
      .in("account_id", accountIds)
      .eq("platform", "meta")
      .order("review_date", { ascending: false })
      .order("created_at", { ascending: false });

    const latestBudgetByAccount = new Map<string, number>();
    for (const r of reviews ?? []) {
      if (!latestBudgetByAccount.has(r.account_id) && r.daily_budget_current) {
        latestBudgetByAccount.set(r.account_id, Number(r.daily_budget_current));
      }
    }

    // 4. Alertas recentes para dedup
    const dedupSince = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recentAlerts } = await supabase
      .from("low_balance_alerts")
      .select("account_id, dias_restantes, sent_at")
      .gte("sent_at", dedupSince);

    // Para cada conta, menor (pior) nível já enviado
    const recentByAccount = new Map<string, number>();
    for (const a of recentAlerts ?? []) {
      const dias = Number(a.dias_restantes);
      // Reconstroi rank: <0 esgotado(0), <=1 critico(1), <=3 baixo(2)
      const rank = dias < 0 ? 0 : dias <= 1 ? 1 : 2;
      const prev = recentByAccount.get(a.account_id);
      if (prev === undefined || rank < prev) recentByAccount.set(a.account_id, rank);
    }

    type AlertItem = {
      account_id_uuid: string;
      client_id: string;
      company: string;
      account_name: string;
      saldo: number;
      dailyBudget: number;
      dias: number;
      level: Level;
    };

    const toAlert: AlertItem[] = [];

    for (const acc of accounts) {
      const client = clientMap.get(acc.client_id);
      if (!client) continue;

      const saldo = Number(acc.saldo_restante);
      const dailyBudget = latestBudgetByAccount.get(acc.id) ?? 0;

      let level: Level | null = null;
      let dias = 0;

      if (saldo <= 0) {
        level = "esgotado";
        dias = -1;
      } else if (dailyBudget > 0) {
        dias = saldo / dailyBudget;
        if (dias <= 1) level = "critico";
        else if (dias <= THRESHOLD_DAYS) level = "baixo";
      }

      if (!level) continue;

      // Dedup: só envia se piorou (rank menor) ou nunca enviado na janela
      const currentRank = levelRank(level);
      const lastRank = recentByAccount.get(acc.id);
      if (lastRank !== undefined && currentRank >= lastRank) continue;

      toAlert.push({
        account_id_uuid: acc.id,
        client_id: acc.client_id,
        company: client.company_name,
        account_name: acc.account_name,
        saldo,
        dailyBudget,
        dias,
        level,
      });
    }

    if (toAlert.length === 0) {
      await supabase.from("system_logs").insert({
        event_type: "low_balance_alerts",
        message: "Verificação executada — nenhum alerta novo",
        details: { checked: accounts.length, threshold_days: THRESHOLD_DAYS },
      });
      return new Response(JSON.stringify({ ok: true, alerts: 0, checked: accounts.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Agrupar por nível
    const groups: Record<Level, AlertItem[]> = { esgotado: [], critico: [], baixo: [] };
    for (const a of toAlert) groups[a.level].push(a);
    groups.critico.sort((a, b) => a.dias - b.dias);
    groups.baixo.sort((a, b) => a.dias - b.dias);
    groups.esgotado.sort((a, b) => a.company.localeCompare(b.company));

    const sections: string[] = [];
    if (groups.esgotado.length > 0) {
      sections.push(
        `🔴 **Saldo esgotado**\n` +
          groups.esgotado
            .map((a) => `• **${a.company}** · ${a.account_name} — ${fmtBRL(a.saldo)}`)
            .join("\n"),
      );
    }
    if (groups.critico.length > 0) {
      sections.push(
        `🟠 **Crítico (≤ 1 dia)**\n` +
          groups.critico
            .map(
              (a) =>
                `• **${a.company}** · ${a.account_name} — ${fmtBRL(a.saldo)} · ~${a.dias.toFixed(1)} dia(s)`,
            )
            .join("\n"),
      );
    }
    if (groups.baixo.length > 0) {
      sections.push(
        `🟡 **Baixo (≤ ${THRESHOLD_DAYS} dias)**\n` +
          groups.baixo
            .map(
              (a) =>
                `• **${a.company}** · ${a.account_name} — ${fmtBRL(a.saldo)} · ~${a.dias.toFixed(1)} dia(s)`,
            )
            .join("\n"),
      );
    }

    const content =
      `@everyone ⚠️ **Alerta de saldo — Meta Ads**\n\n` +
      sections.join("\n\n") +
      `\n\n_Verifique e providencie recarga._`;

    const discordResp = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${discordToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          allowed_mentions: { parse: ["everyone"] },
        }),
      },
    );

    const discordBody = await discordResp.text();
    if (!discordResp.ok) {
      await supabase.from("system_logs").insert({
        event_type: "low_balance_alerts_error",
        message: "Falha ao enviar alerta no Discord",
        details: { status: discordResp.status, body: discordBody.slice(0, 500) },
      });
      return new Response(
        JSON.stringify({ error: "Discord API error", status: discordResp.status, body: discordBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let messageId: string | null = null;
    try {
      messageId = JSON.parse(discordBody).id ?? null;
    } catch (_) {}

    const rows = toAlert.map((a) => ({
      account_id: a.account_id_uuid,
      client_id: a.client_id,
      dias_restantes: a.level === "esgotado" ? -1 : Number(a.dias.toFixed(2)),
      saldo: a.saldo,
      daily_budget: a.dailyBudget,
      discord_message_id: messageId,
    }));
    await supabase.from("low_balance_alerts").insert(rows);

    await supabase.from("system_logs").insert({
      event_type: "low_balance_alerts",
      message: `Enviados ${toAlert.length} alertas de saldo no Discord`,
      details: {
        alerts: toAlert.length,
        checked: accounts.length,
        message_id: messageId,
        by_level: {
          esgotado: groups.esgotado.length,
          critico: groups.critico.length,
          baixo: groups.baixo.length,
        },
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        alerts: toAlert.length,
        checked: accounts.length,
        message_id: messageId,
        by_level: {
          esgotado: groups.esgotado.length,
          critico: groups.critico.length,
          baixo: groups.baixo.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-low-balance-alerts error:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
