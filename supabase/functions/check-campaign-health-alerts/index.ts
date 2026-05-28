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

function translateStatus(platform: string, status: string): string {
  if (!status) return "Desconhecido";
  const map = platform === "google" ? GOOGLE_STATUS_PT : META_STATUS_PT;
  return map[status] ?? status;
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

    const today = todayBR();

    // Buscar snapshots de hoje com problemas (Meta + Google)
    const { data: snapshots, error: snapErr } = await supabase
      .from("campaign_health")
      .select("id, client_id, account_id, platform, has_account, active_campaigns_count, unserved_campaigns_count, campaigns_detailed")
      .eq("snapshot_date", today)
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

    const clientIds = [...new Set(snapshots.map((s) => s.client_id))];
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

    for (const s of snapshots) {
      const client = clientMap.get(s.client_id);
      if (!client || client.status !== "active") continue;

      accountSummary.set(s.account_id, {
        client_id: s.client_id,
        unserved: Number(s.unserved_campaigns_count ?? 0),
        total_active: Number(s.active_campaigns_count ?? 0),
      });

      const details = Array.isArray(s.campaigns_detailed) ? s.campaigns_detailed : [];
      for (const c of details) {
        const cost = Number(c?.cost ?? 0);
        const impressions = Number(c?.impressions ?? 0);
        if (cost === 0 && impressions === 0) {
          lines.push({
            company: client.company_name,
            platform: s.platform,
            campaignName: String(c?.name ?? "Sem nome"),
            status: String(c?.status ?? ""),
            account_id_uuid: s.account_id,
            client_id: s.client_id,
          });
        }
      }
    }

    if (lines.length === 0) {
      return new Response(JSON.stringify({ ok: true, alerts: 0, checked: snapshots.length }), {
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
      (l) => `> • ${l.company} | ${platformLabel(l.platform)} | ${l.campaignName} - Status: ${translateStatus(l.platform, l.status)}`,
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
      details: { campaigns: lines.length, accounts: rows.length, checked: snapshots.length, message_id: firstMessageId, chunks: chunks.length },
    });

    return new Response(
      JSON.stringify({ ok: true, campaigns: lines.length, accounts: rows.length, checked: snapshots.length, message_id: firstMessageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-campaign-health-alerts error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
