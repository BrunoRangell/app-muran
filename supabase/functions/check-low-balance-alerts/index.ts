import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THRESHOLD_DAYS = 3;

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function brazilNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + -3 * 3600000);
}

function fmtDateBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

async function sendDiscordMessage(channelId: string, token: string, content: string) {
  return fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content, allowed_mentions: { parse: ["everyone"] } }),
  });
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

    const { data: accounts, error: accErr } = await supabase
      .from("client_accounts")
      .select("id, client_id, account_id, account_name, saldo_restante, is_prepay_account")
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

    const { data: clients } = await supabase
      .from("clients")
      .select("id, company_name, status")
      .in("id", clientIds)
      .eq("status", "active");
    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

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
      const dailyBudget = latestBudgetByAccount.get(acc.id) ?? 0;

      let dias: number;
      let include = false;

      if (saldo <= 0) {
        dias = 0;
        include = true;
      } else if (dailyBudget > 0) {
        dias = saldo / dailyBudget;
        include = dias <= THRESHOLD_DAYS;
      } else {
        continue;
      }

      if (!include) continue;

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
        message: "Verificação executada — nenhuma conta com saldo ≤ 3 dias",
        details: { checked: accounts.length },
      });
      return new Response(JSON.stringify({ ok: true, alerts: 0, checked: accounts.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    toAlert.sort((a, b) => a.dias - b.dias);

    const dateStr = fmtDateBR(brazilNow());
    const header = `# ${dateStr}\n### :money_with_wings:  Alerta de saldo baixo - Meta Ads\n\n`;
    const footer = `\n\n@everyone`;
    const lines = toAlert.map(
      (a) => `> • ${a.company} - ${fmtBRL(a.saldo)} (${a.dias.toFixed(1)} dias)`,
    );

    // Quebrar em múltiplas mensagens se passar de 1900 chars
    const chunks: string[] = [];
    let current = "";
    for (const line of lines) {
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
          event_type: "low_balance_alerts_error",
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

    const rows = toAlert.map((a) => ({
      account_id: a.account_id_uuid,
      client_id: a.client_id,
      dias_restantes: Number(a.dias.toFixed(2)),
      saldo: a.saldo,
      daily_budget: a.dailyBudget,
      discord_message_id: firstMessageId,
    }));
    await supabase.from("low_balance_alerts").insert(rows);

    await supabase.from("system_logs").insert({
      event_type: "low_balance_alerts",
      message: `Enviados ${toAlert.length} alertas de saldo no Discord`,
      details: { alerts: toAlert.length, checked: accounts.length, message_id: firstMessageId, chunks: chunks.length },
    });

    return new Response(
      JSON.stringify({ ok: true, alerts: toAlert.length, checked: accounts.length, message_id: firstMessageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-low-balance-alerts error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
