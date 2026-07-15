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
  daysBack: number;
  dateRange: { start: string; end: string };
  meta?: any;
  google?: any;
  metaAdDeltas?: any[];
  googleAdDeltas?: any[];
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
  const includeAdDeltas = daysBack === 7;

  const metaPromise = metaAccountRowIds.length
    ? Promise.all(
        metaAccountRowIds.map((id) =>
          fetchMetaInsights(clientId, id, dateRange, true, includeAdDeltas).catch((e) => {
            errors.push(`meta[${id}]: ${e?.message || e}`);
            return null;
          }),
        ),
      )
    : Promise.resolve([]);

  const googlePromise = googleAccountRowIds.length
    ? Promise.all(
        googleAccountRowIds.map((id) =>
          fetchGoogleInsights(clientId, id, dateRange, true, includeAdDeltas).catch((e) => {
            errors.push(`google[${id}]: ${e?.message || e}`);
            return null;
          }),
        ),
      )
    : Promise.resolve([]);

  const [metaResults, googleResults] = await Promise.all([metaPromise, googlePromise]);

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

  // Consolida adDeltas de todas as contas da mesma plataforma
  const mergeDeltas = (results: any[]): any[] => {
    const merged: any[] = [];
    for (const r of results) {
      if (r?.adDeltas && Array.isArray(r.adDeltas)) merged.push(...r.adDeltas);
    }
    return merged;
  };

  return {
    label,
    daysBack,
    dateRange,
    meta: aggregate(metaResults),
    google: aggregate(googleResults),
    metaAdDeltas: includeAdDeltas ? mergeDeltas(metaResults) : undefined,
    googleAdDeltas: includeAdDeltas ? mergeDeltas(googleResults) : undefined,
    errors,
  };
}


// ---------- Claude ----------

interface AnalysisAction {
  prioridade: string; // P1, P2, ...
  titulo: string;
  justificativa: string;
  acao: string;
}

interface AnalysisJSON {
  resumo_executivo?: string;
  piorou?: string[];
  melhorou?: string[];
  tendencia_30d?: string;
  contexto_90d?: string;
  acoes?: AnalysisAction[];
}

function buildPrompt(
  clientName: string,
  windows: WindowMetrics[],
  hasMeta: boolean,
  hasGoogle: boolean,
): string {
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

  const platformNote =
    hasMeta && hasGoogle
      ? 'O cliente usa Meta E Google Ads. Em cada item de `piorou` e `melhorou`, PREFIXE com "[Meta] " ou "[Google] " para deixar claro a qual plataforma o ponto se refere.'
      : 'O cliente usa apenas uma plataforma. NÃO use prefixos "[Meta]" ou "[Google]" nos itens.';

  return `Você é analista sênior de mídia paga em uma agência (Muran).

Métricas do cliente em 3 janelas comparativas (7d, 30d, 90d — cada uma comparada com o período anterior de mesma duração). Cada métrica tem \`current\`, \`previous\` e \`change\` (% de variação). "meta" = Facebook/Instagram Ads. "google" = Google Ads. Se algum estiver \`null\`, ou o cliente não usa essa plataforma ou houve erro (veja \`erros\`).

${platformNote}

Dados:
\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

Responda **APENAS um JSON válido**, sem texto antes ou depois, sem cercas de código markdown, seguindo EXATAMENTE este schema:

{
  "resumo_executivo": "1 a 2 frases curtas resumindo o quadro geral",
  "piorou": ["ponto 1 com números", "ponto 2 com números", ...],  // 2 a 4 itens, cada um <= 200 chars
  "melhorou": ["ponto 1", ...],  // 1 a 3 itens, cada um <= 200 chars
  "tendencia_30d": "1 a 2 frases: os 7d confirmam tendência ou é ruído?",  // <= 300 chars
  "contexto_90d": "1 a 2 frases sobre sazonalidade / patamar geral",  // <= 300 chars
  "acoes": [
    {
      "prioridade": "P1",
      "titulo": "título curto e concreto",
      "justificativa": "por que, com número",
      "acao": "o que fazer, concreto"
    }
  ]  // 3 a 5 ações, P1 primeiro, cada campo curto (<= 180 chars)
}

Regras:
- Português brasileiro, direto, sem enrolação.
- Use números reais dos dados.
- NÃO inclua markdown, cercas \`\`\`, comentários ou texto fora do JSON.`;
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

function parseAnalysisJSON(raw: string): AnalysisJSON {
  let cleaned = raw.trim();
  // Remove markdown fences se a IA colocou apesar de pedirmos para não colocar
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  // Extrai o primeiro objeto JSON encontrado
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned) as AnalysisJSON;
}

// ---------- Discord embed ----------

const FIELD_LIMIT = 1024;
const DESCRIPTION_LIMIT = 4096;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

function bulletList(items: string[] | undefined, max = FIELD_LIMIT): string | null {
  if (!items || items.length === 0) return null;
  const lines = items.map((i) => `• ${i}`);
  let out = lines.join('\n');
  if (out.length > max) {
    // Trunca item a item
    const kept: string[] = [];
    let total = 0;
    for (const l of lines) {
      if (total + l.length + 1 > max - 1) break;
      kept.push(l);
      total += l.length + 1;
    }
    out = kept.join('\n') + '\n…';
  }
  return out;
}

function formatActions(actions: AnalysisAction[] | undefined): string | null {
  if (!actions || actions.length === 0) return null;
  const blocks = actions.map((a) => {
    const p = (a.prioridade || 'P?').toUpperCase();
    const titulo = a.titulo || '';
    const just = a.justificativa ? `_${a.justificativa}_` : '';
    const acao = a.acao ? `→ ${a.acao}` : '';
    return `**${p} — ${titulo}**\n${just}${just && acao ? '\n' : ''}${acao}`.trim();
  });
  let out = blocks.join('\n\n');
  if (out.length > FIELD_LIMIT) {
    // Reduz iterativamente
    const kept: string[] = [];
    let total = 0;
    for (const b of blocks) {
      if (total + b.length + 2 > FIELD_LIMIT - 1) break;
      kept.push(b);
      total += b.length + 2;
    }
    out = kept.join('\n\n') + '\n…';
  }
  return out;
}

function buildEmbed(
  clientName: string,
  analysis: AnalysisJSON,
  hasMeta: boolean,
  hasGoogle: boolean,
  platformErrors: { meta: boolean; google: boolean; details: string[] },
) {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  // Nota de fallback (erros de coleta)
  const notas: string[] = [];
  if (hasMeta && platformErrors.meta) notas.push('⚠️ Meta Ads: falha ao coletar métricas nesta análise.');
  if (hasGoogle && platformErrors.google) notas.push('⚠️ Google Ads: falha ao coletar métricas nesta análise.');
  if (notas.length) {
    fields.push({
      name: '⚠️ Observações',
      value: truncate(notas.join('\n'), FIELD_LIMIT),
    });
  }

  const piorou = bulletList(analysis.piorou);
  if (piorou) fields.push({ name: '📉 O que piorou (7d)', value: piorou });

  const melhorou = bulletList(analysis.melhorou);
  if (melhorou) fields.push({ name: '📈 O que melhorou (7d)', value: melhorou });

  if (analysis.tendencia_30d) {
    fields.push({ name: '📊 Tendência 30 dias', value: truncate(analysis.tendencia_30d, FIELD_LIMIT) });
  }
  if (analysis.contexto_90d) {
    fields.push({ name: '🗓️ Contexto 90 dias', value: truncate(analysis.contexto_90d, FIELD_LIMIT) });
  }

  const acoes = formatActions(analysis.acoes);
  if (acoes) fields.push({ name: '🎯 Ações priorizadas', value: acoes });

  const platformLabel = [hasMeta ? 'Meta' : null, hasGoogle ? 'Google' : null]
    .filter(Boolean)
    .join(' + ');

  const description = analysis.resumo_executivo
    ? truncate(analysis.resumo_executivo, DESCRIPTION_LIMIT)
    : undefined;

  return {
    title: truncate(`🤖 Análise de otimização — ${clientName}`, 256),
    description,
    color: 0xff6e00,
    fields,
    footer: {
      text: `${platformLabel} · janelas 7d / 30d / 90d`,
    },
    timestamp: new Date().toISOString(),
  };
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
  const hasMeta = metaIds.length > 0;
  const hasGoogle = googleIds.length > 0;

  if (!hasMeta && !hasGoogle) {
    await editOriginal(appId, interactionToken, {
      content: `❌ **${clientName}** não tem contas ativas de Meta ou Google Ads cadastradas.`,
    });
    return;
  }

  const windows = await Promise.all([
    collectWindow(clientId, metaIds, googleIds, 7, 'Últimos 7 dias'),
    collectWindow(clientId, metaIds, googleIds, 30, 'Últimos 30 dias'),
    collectWindow(clientId, metaIds, googleIds, 90, 'Últimos 90 dias'),
  ]);

  const hasAnyData = windows.some((w) => w.meta || w.google);
  if (!hasAnyData) {
    const allErrors = windows.flatMap((w) => w.errors).join('\n');
    await editOriginal(appId, interactionToken, {
      content: `⚠️ Não foi possível coletar métricas de **${clientName}**.\n\`\`\`\n${allErrors.slice(0, 1500)}\n\`\`\``,
    });
    return;
  }

  // Detecta falha por plataforma: se plataforma esperada não tem NENHUM dado em nenhuma janela
  const platformErrors = {
    meta: hasMeta && windows.every((w) => !w.meta),
    google: hasGoogle && windows.every((w) => !w.google),
    details: windows.flatMap((w) => w.errors),
  };

  const prompt = buildPrompt(clientName, windows, hasMeta, hasGoogle);
  let rawAnalysis: string;
  try {
    rawAnalysis = await callClaude(anthropicKey, prompt);
  } catch (e: any) {
    await editOriginal(appId, interactionToken, {
      content: `⚠️ Erro ao chamar IA: ${e?.message || 'desconhecido'}`,
    });
    return;
  }

  let parsed: AnalysisJSON;
  try {
    parsed = parseAnalysisJSON(rawAnalysis);
  } catch (e: any) {
    console.error('[parse] falhou', e, 'raw:', rawAnalysis.slice(0, 500));
    // Fallback: manda o texto bruto truncado como description
    await editOriginal(appId, interactionToken, {
      embeds: [
        {
          title: truncate(`🤖 Análise de otimização — ${clientName}`, 256),
          description: truncate(rawAnalysis, DESCRIPTION_LIMIT),
          color: 0xff6e00,
          footer: { text: '⚠️ Resposta da IA veio em formato inesperado (fallback texto)' },
        },
      ],
    });
    return;
  }

  const embed = buildEmbed(clientName, parsed, hasMeta, hasGoogle, platformErrors);
  await editOriginal(appId, interactionToken, { embeds: [embed] });
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
