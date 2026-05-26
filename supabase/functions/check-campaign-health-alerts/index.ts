import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getTodayInBrazil(): string {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const brazilTime = new Date(utcTime + -3 * 3600000);
  const y = brazilTime.getFullYear();
  const m = String(brazilTime.getMonth() + 1).padStart(2, "0");
  const d = String(brazilTime.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
        JSON.stringify({
          error: "DISCORD_TOKEN ou DISCORD_LOW_BALANCE_CHANNEL_ID não configurado",
          has_token: !!discordToken,
          has_channel: !!channelId,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = getTodayInBrazil();

    // 1. Buscar snapshots de hoje com problemas (Meta apenas — Google ainda não populado)
    const { data: snapshots, error: snapErr } = await supabase
      .from("campaign_health")
      .select(
        "id, client_id, account_id, platform, has_account, active_campaigns_count, unserved_campaigns_count, campaigns_detailed",
      )
      .eq("snapshot_date", today)
      .eq("platform", "meta")
      .eq("has_account", true)
      .gt("unserved_campaigns_count", 0);

    if (snapErr) throw snapErr;

    if (!snapshots || snapshots.length === 0) {
      await supabase.from("system_logs").insert({
        event_type: "campaign_health_alerts",
        message: "Verificação executada — nenhuma campanha sem veiculação",
        details: { date: today },
      });
      return new Response(JSON.stringify({ ok: true, alerts: 0, checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Dedup: já enviado hoje?
    const accountIds = snapshots.map((s) => s.account_id);
    const { data: existingAlerts } = await supabase
      .from("campaign_health_alerts")
      .select("account_id")
      .eq("snapshot_date", today)
      .in("account_id", accountIds);

    const alreadySent = new Set((existingAlerts ?? []).map((a) => a.account_id));
    const newSnapshots = snapshots.filter((s) => !alreadySent.has(s.account_id));

    if (newSnapshots.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, alerts: 0, checked: snapshots.length, skipped_dedup: snapshots.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Resolver client_accounts e clients
    const clientIds = [...new Set(newSnapshots.map((s) => s.client_id))];
    const accountUuids = [...new Set(newSnapshots.map((s) => s.account_id))];

    const [{ data: accounts }, { data: clients }] = await Promise.all([
      supabase
        .from("client_accounts")
        .select("id, account_name, account_id")
        .in("id", accountUuids),
      supabase.from("clients").select("id, company_name, status").in("id", clientIds),
    ]);

    const accMap = new Map((accounts ?? []).map((a) => [a.id, a]));
    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

    type Item = {
      account_id_uuid: string;
      client_id: string;
      company: string;
      account_name: string;
      unserved: number;
      total_active: number;
      unservedNames: string[];
    };

    const items: Item[] = [];

    for (const s of newSnapshots) {
      const client = clientMap.get(s.client_id);
      const acc = accMap.get(s.account_id);
      if (!client || client.status !== "active" || !acc) continue;

      const details = Array.isArray(s.campaigns_detailed) ? s.campaigns_detailed : [];
      const unservedNames = details
        .filter((c: any) => Number(c?.cost ?? 0) === 0 && Number(c?.impressions ?? 0) === 0)
        .map((c: any) => String(c?.name ?? "Sem nome"))
        .slice(0, 8);

      items.push({
        account_id_uuid: s.account_id,
        client_id: s.client_id,
        company: client.company_name,
        account_name: acc.account_name,
        unserved: Number(s.unserved_campaigns_count ?? 0),
        total_active: Number(s.active_campaigns_count ?? 0),
        unservedNames,
      });
    }

    if (items.length === 0) {
      return new Response(JSON.stringify({ ok: true, alerts: 0, checked: snapshots.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    items.sort((a, b) => b.unserved - a.unserved);

    const lines = items
      .map((it) => {
        const header = `• **${it.company}** · ${it.account_name} — ${it.unserved} de ${it.total_active} campanha(s) sem veiculação`;
        if (it.unservedNames.length === 0) return header;
        const sub = it.unservedNames.map((n) => `    - ${n}`).join("\n");
        return `${header}\n${sub}`;
      })
      .join("\n\n");

    const content =
      `@everyone 🚨 **Campanhas sem veiculação — Meta Ads**\n\n` +
      lines +
      `\n\n_Campanhas ativas com 0 impressões e 0 gasto hoje. Verifique no Gerenciador._`;

    const discordResp = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bot ${discordToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content, allowed_mentions: { parse: ["everyone"] } }),
      },
    );

    const discordBody = await discordResp.text();
    if (!discordResp.ok) {
      await supabase.from("system_logs").insert({
        event_type: "campaign_health_alerts_error",
        message: "Falha ao enviar alerta de campanhas no Discord",
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

    const rows = items.map((it) => ({
      account_id: it.account_id_uuid,
      client_id: it.client_id,
      snapshot_date: today,
      unserved_count: it.unserved,
      total_active: it.total_active,
      discord_message_id: messageId,
    }));
    await supabase.from("campaign_health_alerts").insert(rows);

    await supabase.from("system_logs").insert({
      event_type: "campaign_health_alerts",
      message: `Enviados ${items.length} alertas de campanhas sem veiculação`,
      details: { alerts: items.length, checked: snapshots.length, message_id: messageId },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        alerts: items.length,
        checked: snapshots.length,
        message_id: messageId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-campaign-health-alerts error:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
