import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THRESHOLD_DAYS = 3;
const DEDUP_WINDOW_HOURS = 11; // não re-alerta a mesma conta se já alertado nas últimas 11h com mesmo nível

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
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

    if (!discordToken || !channelId) {
      return new Response(
        JSON.stringify({ error: "DISCORD_TOKEN ou DISCORD_LOW_BALANCE_CHANNEL_ID não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Buscar contas Meta pré-pagas ativas com saldo
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

    // 2. Buscar clientes
    const { data: clients } = await supabase
      .from("clients")
      .select("id, company_name, status")
      .in("id", clientIds)
      .eq("status", "active");

    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

    // 3. Buscar últimas reviews para daily_budget_current
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

    // 4. Buscar alertas recentes (deduplicação)
    const dedupSince = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recentAlerts } = await supabase
      .from("low_balance_alerts")
      .select("account_id, dias_restantes, sent_at")
      .gte("sent_at", dedupSince);

    const recentByAccount = new Map<string, number>();
    for (const a of recentAlerts ?? []) {
      const prev = recentByAccount.get(a.account_id);
      if (prev === undefined || Number(a.dias_restantes) < prev) {
        recentByAccount.set(a.account_id, Number(a.dias_restantes));
      }
    }

    // 5. Calcular e filtrar
    type AlertItem = {
      account_id_uuid: string;
      client_id: string;
      company: string;
      account_name: string;
      saldo: number;
      dailyBudget: number;
      dias: number;
    };

    const toAlert: AlertItem[] = [];

    for (const acc of accounts) {
      const client = clientMap.get(acc.client_id);
      if (!client) continue;

      const saldo = Number(acc.saldo_restante);
      const dailyBudget = latestBudgetByAccount.get(acc.id);
      if (!dailyBudget || dailyBudget <= 0 || saldo <= 0) continue;

      const dias = saldo / dailyBudget;
      if (dias > THRESHOLD_DAYS) continue;

      // Deduplicação: só alerta se piorou desde último envio (ou nunca foi avisado na janela)
      const lastDias = recentByAccount.get(acc.id);
      const diasFloor = Math.floor(dias);
      if (lastDias !== undefined && diasFloor >= Math.floor(lastDias)) {
        // Mesmo nível ou melhor — pula
        continue;
      }

      toAlert.push({
        account_id_uuid: acc.id,
        client_id: acc.client_id,
        company: client.company_name,
        account_name: acc.account_name,
        saldo,
        dailyBudget,
        dias,
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

    // 6. Ordenar (menor dias primeiro)
    toAlert.sort((a, b) => a.dias - b.dias);

    // 7. Montar mensagem Discord
    const lines = toAlert
      .map(
        (a) =>
          `• **${a.company}** · ${a.account_name} — ${fmtBRL(a.saldo)} · ~${a.dias.toFixed(1)} dia(s)`,
      )
      .join("\n");

    const content = `@everyone ⚠️ **Alerta de saldo baixo — Meta Ads**\n\n${lines}\n\n_Saldo suficiente para ${THRESHOLD_DAYS} dia(s) ou menos. Verifique e providencie recarga._`;

    // 8. Enviar para Discord
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

    // 9. Registrar alertas no banco
    const rows = toAlert.map((a) => ({
      account_id: a.account_id_uuid,
      client_id: a.client_id,
      dias_restantes: Number(a.dias.toFixed(2)),
      saldo: a.saldo,
      daily_budget: a.dailyBudget,
      discord_message_id: messageId,
    }));
    await supabase.from("low_balance_alerts").insert(rows);

    await supabase.from("system_logs").insert({
      event_type: "low_balance_alerts",
      message: `Enviados ${toAlert.length} alertas de saldo baixo no Discord`,
      details: { alerts: toAlert.length, checked: accounts.length, message_id: messageId },
    });

    return new Response(
      JSON.stringify({ ok: true, alerts: toAlert.length, checked: accounts.length, message_id: messageId }),
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
