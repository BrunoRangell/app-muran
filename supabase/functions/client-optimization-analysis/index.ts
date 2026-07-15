// Gera análise de otimização com IA (Claude) para 1 cliente.
// Coleta métricas dos últimos 7d/30d/90d (Meta e/ou Google) reaproveitando
// os helpers de ../traffic-insights/, chama a Anthropic Messages API e
// envia a resposta como follow-up para o webhook da interação do Discord.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { fetchMetaInsights } from './meta-insights.ts';
import { fetchGoogleInsights } from './google-insights.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const DISCORD_CHUNK = 1900;

// ---------- helpers de data ----------

function ymd(d: Date): string {
  return d.toISOString().split('T')[0];
}

function windowRange(daysBack: number): { start: string; end: string } {
  const end = new Date();
  end.setDate(end.getDate() - 1); // ontem
  const start = new Date(end);
  start.setDate(start.getDate() - (daysBack - 1));
  return { start: ymd(start), end: ymd(end) };
}

// ---------- Discord ----------

async function editOriginal(appId: string, token: string, payload: unknown) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[edit]', res.status, await res.text());
}

async function followup(appId: string, token: string, payload: unknown) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[followup]', res.status, await res.text());
}

function chunkForDiscord(text: string): string[] {
  const parts: string[] = [];
  let remaining = text.trim();
  while (remaining.length > DISCORD_CHUNK) {
    // tenta quebrar em fronteira de parágrafo/linha
    let cut = remaining.lastIndexOf('\n\n', DISCORD_CHUNK);
    if (cut < DISCORD_CHUNK * 0.5) cut = remaining.lastIndexOf('\n', DISCORD_CHUNK);
    if (cut < DISCORD_CHUNK * 0.5) cut = DISCORD_CHUNK;
    parts.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trim();
  }
  if (remaining.length) parts.push(remaining);
  return parts;
}

async function sendChunks(appId: string, token: string, text: string) {
  const chunks = chunkForDiscord(text);
  if (chunks.length === 0) return;
  await editOriginal(appId, token, { content: chunks[0] });
  for (let i = 1; i < chunks.length; i++) {
    await followup(appId, token, { content: chunks[i] });
  }
}

// ---------- coleta de métricas ----------

interface WindowMetrics {
  label: string;
  dateRange: { start: string; end: string };
  meta?: any;
  google?: any;
  errors: string[];
}

function extractOverview(resp: any) {
  if (!resp?.overview) return null;
  const o = resp.overview;
  const pick = (m: any) => m ? { current: m.current, previous: m.previous, change: m.change } : null;
  return {
    impressions: pick(o.impressions),
    reach: pick(o.reach),
    clicks: pick(o.clicks),
    ctr: pick(o.ctr),
    cpc: pick(o.cpc),
    spend: pick(o.spend),
    conversions: pick(o.conversions),
    cpa: pick(o.cpa),
  };
}

async function collectWindow(
  clientId: string,
  metaAccountRowIds: string[],
  googleAccountRowIds: string[],
  daysBack: number,
  label: string,
): Promise<WindowMetrics> {
  const dateRange = windowRange(daysBack);
  const errors: string[] = [];

  const metaPromise = metaAccountRowIds.length
    ? Promise.all(
        metaAccountRowIds.map((id) =>
          fetchMetaInsights(clientId, id, dateRange, true).catch((e) => {
            errors.push(`meta[${id}]: ${e?.message || e}`);
            return null;
          }),
        ),
      )
    : Promise.resolve([]);

  const googlePromise = googleAccountRowIds.length
    ? Promise.all(
        googleAccountRowIds.map((id) =>
          fetchGoogleInsights(clientId, id, dateRange, true).catch((e) => {
            errors.push(`google[${id}]: ${e?.message || e}`);
            return null;
          }),
        ),
      )
    : Promise.resolve([]);

  const [metaResults, googleResults] = await Promise.all([metaPromise, googlePromise]);

  // Agrega múltiplas contas da mesma plataforma somando `current` e `previous`
  const aggregate = (results: any[]) => {
    const valid = results.filter(Boolean);
    if (valid.length === 0) return null;
    if (valid.length === 1) return extractOverview(valid[0]);
    const acc: any = {};
    const keys = ['impressions', 'reach', 'clicks', 'spend', 'conversions'];
    for (const k of keys) {
      let cur = 0, prev = 0;
      for (const r of valid) {
        cur += r.overview?.[k]?.current || 0;
        prev += r.overview?.[k]?.previous || 0;
      }
      const change = prev > 0 ? ((cur - prev) / prev) * 100 : 0;
      acc[k] = { current: cur, previous: prev, change };
    }
    // derivadas
    acc.ctr = {
      current: acc.impressions.current > 0 ? (acc.clicks.current / acc.impressions.current) * 100 : 0,
      previous: acc.impressions.previous > 0 ? (acc.clicks.previous / acc.impressions.previous) * 100 : 0,
      change: 0,
    };
    acc.cpc = {
      current: acc.clicks.current > 0 ? acc.spend.current / acc.clicks.current : 0,
      previous: acc.clicks.previous > 0 ? acc.spend.previous / acc.clicks.previous : 0,
      change: 0,
    };
    acc.cpa = {
      current: acc.conversions.current > 0 ? acc.spend.current / acc.conversions.current : 0,
      previous: acc.conversions.previous > 0 ? acc.spend.previous / acc.conversions.previous : 0,
      change: 0,
    };
    for (const k of ['ctr', 'cpc', 'cpa']) {
      acc[k].change = acc[k].previous > 0 ? ((acc[k].current - acc[k].previous) / acc[k].previous) * 100 : 0;
    }
    return acc;
  };

  return {
    label,
    dateRange,
    meta: aggregate(metaResults),
    google: aggregate(googleResults),
    errors,
  };
}

// ---------- Claude ----------

function buildPrompt(clientName: string, windows: WindowMetrics[]): string {
  const summary = {
    cliente: clientName,
    janelas: windows.map((w) => ({
      periodo: w.label,
      datas: w.dateRange,
      meta: w.meta,
      google: w.google,
      erros: w.errors,
    })),
  };

  return `Você é analista sênior de mídia paga em uma agência (Muran).

Abaixo estão as métricas de anúncios de UM cliente, em 3 janelas comparativas:
- **7 dias vs 7 dias anteriores** (sinal imediato)
- **30 dias vs 30 dias anteriores** (confirmação de tendência)
- **90 dias vs 90 dias anteriores** (contexto de sazonalidade)

Cada métrica tem \`current\`, \`previous\` e \`change\` (% de variação). "meta" = Facebook/Instagram Ads. "google" = Google Ads. Se algum estiver \`null\`, o cliente não usa essa plataforma OU houve erro na coleta (veja \`erros\`).

Dados:
\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

Entregue uma análise **em português brasileiro, direta, sem enrolação**, formatada em markdown compatível com Discord (use **negrito**, listas com \`-\`, sem tabelas). Estrutura:

**📉 O que piorou (últimos 7d vs anteriores)**
Liste 2–4 pontos concretos com números.

**📈 O que melhorou**
1–3 pontos.

**📊 Tendência dos 30 dias**
Confirma o que os 7d indicam? Ou é ruído?

**🗓️ Contexto dos 90 dias**
Contexto de sazonalidade / patamar geral.

**🎯 Hipóteses e ações priorizadas**
3 a 5 ações CONCRETAS, priorizadas (P1 > P2 > P3), com justificativa curta. Ex: "P1 — Pausar campanha X: CPA subiu 180% nos últimos 7d enquanto conversões caíram."

Seja objetivo. Máximo ~1200 palavras.`;
}

async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[claude] error', res.status, data);
    throw new Error(data?.error?.message || `Anthropic API ${res.status}`);
  }
  const text = (data?.content || [])
    .filter((c: any) => c.type === 'text')
    .map((c: any) => c.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Resposta vazia da IA');
  return text;
}

// ---------- Orquestração ----------

async function runAnalysis(
  clientId: string,
  clientName: string,
  appId: string,
  interactionToken: string,
) {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    await editOriginal(appId, interactionToken, {
      content:
        '⚠️ `ANTHROPIC_API_KEY` não configurada. Adicione a secret em ' +
        'Supabase → Edge Functions → Manage secrets e tente novamente.',
    });
    return;
  }

  // Contas ativas do cliente
  const { data: accounts, error: accErr } = await supabase
    .from('client_accounts')
    .select('id, platform, account_id, account_name')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .not('account_id', 'is', null)
    .neq('account_id', '');

  if (accErr) {
    await editOriginal(appId, interactionToken, { content: `⚠️ Erro ao buscar contas: ${accErr.message}` });
    return;
  }

  const metaIds = (accounts || []).filter((a) => a.platform === 'meta').map((a) => a.id);
  const googleIds = (accounts || []).filter((a) => a.platform === 'google').map((a) => a.id);

  if (metaIds.length === 0 && googleIds.length === 0) {
    await editOriginal(appId, interactionToken, {
      content: `❌ **${clientName}** não tem contas ativas de Meta ou Google Ads cadastradas.`,
    });
    return;
  }

  // Coleta paralela das 3 janelas
  const windows = await Promise.all([
    collectWindow(clientId, metaIds, googleIds, 7, 'Últimos 7 dias'),
    collectWindow(clientId, metaIds, googleIds, 30, 'Últimos 30 dias'),
    collectWindow(clientId, metaIds, googleIds, 90, 'Últimos 90 dias'),
  ]);

  // Se todas as janelas ficaram sem dados de ambas as plataformas, aborta.
  const hasAnyData = windows.some((w) => w.meta || w.google);
  if (!hasAnyData) {
    const allErrors = windows.flatMap((w) => w.errors).join('\n');
    await editOriginal(appId, interactionToken, {
      content: `⚠️ Não foi possível coletar métricas de **${clientName}**.\n\`\`\`\n${allErrors.slice(0, 1500)}\n\`\`\``,
    });
    return;
  }

  const prompt = buildPrompt(clientName, windows);
  let analysis: string;
  try {
    analysis = await callClaude(anthropicKey, prompt);
  } catch (e: any) {
    await editOriginal(appId, interactionToken, {
      content: `⚠️ Erro ao chamar IA: ${e?.message || 'desconhecido'}`,
    });
    return;
  }

  const header =
    `🤖 **Análise de otimização — ${clientName}**\n` +
    `Plataformas: ${[metaIds.length ? 'Meta' : null, googleIds.length ? 'Google' : null].filter(Boolean).join(' + ')}\n` +
    `Janelas: 7d · 30d · 90d (comparadas com o período anterior)\n\n`;

  await sendChunks(appId, interactionToken, header + analysis);
}

// ---------- Entry point ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { clientId, clientName, appId, interactionToken } = await req.json();
    if (!clientId || !appId || !interactionToken) {
      return new Response(
        JSON.stringify({ error: 'clientId, appId e interactionToken são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Roda em background — quem chama (discord-interactions) recebe 200 imediatamente
    // @ts-ignore — runtime Deno
    EdgeRuntime.waitUntil(runAnalysis(clientId, clientName || 'Cliente', appId, interactionToken));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[client-optimization-analysis] erro', e);
    return new Response(JSON.stringify({ error: e?.message || 'erro' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
