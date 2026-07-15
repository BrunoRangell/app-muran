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
    results: pick(o.results),
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
    const keys = ['impressions', 'reach', 'clicks', 'spend', 'conversions', 'results'];
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
    // CPA "por resultado" quando disponível; senão, por conversion whitelist antiga.
    const cpaDenomCur = acc.results.current > 0 ? acc.results.current : acc.conversions.current;
    const cpaDenomPrev = acc.results.previous > 0 ? acc.results.previous : acc.conversions.previous;
    acc.cpa = {
      current: cpaDenomCur > 0 ? acc.spend.current / cpaDenomCur : 0,
      previous: cpaDenomPrev > 0 ? acc.spend.previous / cpaDenomPrev : 0,
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

  // Consolida resultsMeta (objetivos Meta / categorias Google)
  const mergeResultsMeta = (results: any[]) => {
    const valid = results.filter(Boolean);
    if (valid.length === 0) return null;
    const first = valid[0];
    if (first?.resultsMeta?.objectiveBreakdown !== undefined) {
      // Meta
      const objectiveBreakdown: Record<string, number> = {};
      const funnelCur: Record<string, number> = {};
      const funnelPrev: Record<string, number> = {};
      let anyEstimated = false;
      for (const r of valid) {
        const m = r.resultsMeta || {};
        anyEstimated = anyEstimated || !!m.estimated;
        for (const [k, v] of Object.entries<any>(m.objectiveBreakdown || {})) objectiveBreakdown[k] = (objectiveBreakdown[k] || 0) + v;
        for (const [k, v] of Object.entries<any>(m.funnel?.current || {})) funnelCur[k] = (funnelCur[k] || 0) + Number(v);
        for (const [k, v] of Object.entries<any>(m.funnel?.previous || {})) funnelPrev[k] = (funnelPrev[k] || 0) + Number(v);
      }
      return { platform: 'meta' as const, estimated: anyEstimated, objectiveBreakdown, funnel: { current: funnelCur, previous: funnelPrev } };
    }
    if (first?.resultsMeta?.primaryCategory !== undefined) {
      // Google
      const catCur: Record<string, number> = {};
      const catPrev: Record<string, number> = {};
      let primaryCategory: string | null = null;
      let maxVal = 0;
      let estimated = true;
      for (const r of valid) {
        const m = r.resultsMeta || {};
        estimated = estimated && !!m.estimated;
        for (const [k, v] of Object.entries<any>(m.categoryBreakdown?.current || {})) catCur[k] = (catCur[k] || 0) + Number(v);
        for (const [k, v] of Object.entries<any>(m.categoryBreakdown?.previous || {})) catPrev[k] = (catPrev[k] || 0) + Number(v);
      }
      for (const [k, v] of Object.entries(catCur)) {
        if (v > maxVal) { maxVal = v; primaryCategory = k; }
      }
      return { platform: 'google' as const, estimated: !primaryCategory, primaryCategory, categoryBreakdown: { current: catCur, previous: catPrev } };
    }
    return null;
  };

  return {
    label,
    daysBack,
    dateRange,
    meta: aggregate(metaResults),
    google: aggregate(googleResults),
    metaAdDeltas: includeAdDeltas ? mergeDeltas(metaResults) : undefined,
    googleAdDeltas: includeAdDeltas ? mergeDeltas(googleResults) : undefined,
    metaResultsMeta: mergeResultsMeta(metaResults),
    googleResultsMeta: mergeResultsMeta(googleResults),
    errors,
  } as WindowMetrics;
}



// ---------- Claude ----------

interface PlatformAnalysis {
  status?: 'piorando' | 'misto' | 'melhorando' | string;
  piorou?: string[];
  melhorou?: string[];
}

interface AnalysisJSON {
  resumo_executivo?: string;
  meta?: PlatformAnalysis | null;
  google?: PlatformAnalysis | null;
}

function buildPrompt(
  clientName: string,
  windows: WindowMetrics[],
  hasMeta: boolean,
  hasGoogle: boolean,
): string {
  const w7 = windows.find((w) => w.daysBack === 7);
  const summary = {
    cliente: clientName,
    janelas: windows.map((w) => ({
      periodo: w.label,
      datas: w.dateRange,
      meta: w.meta,
      google: w.google,
      erros: w.errors,
    })),
    anuncios_7d: {
      meta: w7?.metaAdDeltas || [],
      google: w7?.googleAdDeltas || [],
      // "Só anúncios com >=300 impressões no período foram incluídos."
    },
  };

  const platformsAsked: string[] = [];
  if (hasMeta) platformsAsked.push('meta');
  if (hasGoogle) platformsAsked.push('google');

  return `Você é analista sênior de mídia paga na agência Muran.

Você recebe métricas de 1 cliente em 3 janelas comparativas (7d, 30d, 90d — cada uma vs. período anterior de mesma duração). "meta" = Facebook/Instagram Ads. "google" = Google Ads. Cada métrica traz \`current\`, \`previous\` e \`change\` (% de variação).

Além disso, para a janela de 7 dias você recebe \`anuncios_7d\` com deltas por anúncio individual (só anúncios com pelo menos 300 impressões no período — abaixo disso é ruído estatístico, ignore).

Plataformas que este cliente usa: ${platformsAsked.join(' e ')}.

Heurísticas causa→padrão (use como base de raciocínio, cite o padrão que observou — não afirme causa como fato absoluto, use "sugere", "indica", "pode estar"):
- CTR caindo + frequência subindo → fadiga de criativo
- CPC subindo + CTR estável → leilão mais caro / mais concorrência
- Conversões caindo com CTR/CPC estáveis → possível problema de tracking, landing page ou qualidade de lead
- CPA piorando + spend subindo + conversões estáveis → ineficiência de segmentação / público saturado
- Impressões e clicks caindo juntos → possível problema de entrega (orçamento, aprovação, aprendizado)

Dados:
\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

Responda **APENAS um JSON válido**, sem texto antes ou depois, sem cercas de código markdown, seguindo EXATAMENTE este schema:

{
  "resumo_executivo": "1 a 2 frases gerais do quadro do cliente",
  "meta": {
    "status": "piorando" | "misto" | "melhorando",
    "piorou": ["parágrafo em texto corrido com causa provável + sugestão embutida, citando números e (quando aplicável) o anúncio específico responsável pelo nome"],
    "melhorou": ["parágrafo em texto corrido"]
  },
  "google": { "status": "...", "piorou": [...], "melhorou": [...] }
}

Regras críticas:
- \`meta\` deve ser \`null\` se o cliente NÃO usa Meta (${hasMeta ? 'usa — preencha' : 'NÃO usa — retorne null'}).
- \`google\` deve ser \`null\` se o cliente NÃO usa Google (${hasGoogle ? 'usa — preencha' : 'NÃO usa — retorne null'}).
- \`piorou\`: 1 a 3 parágrafos, cada um até ~350 caracteres. Cada parágrafo deve incluir CAUSA PROVÁVEL + SUGESTÃO CONCRETA de solução embutida no mesmo texto, não em lista separada.
- \`melhorou\`: 1 a 2 parágrafos, mesmo formato.
- Cite o nome do anúncio específico responsável por uma variação SEMPRE que \`anuncios_7d\` mostrar um anúncio claramente responsável (com >=300 impressões — o filtro já foi aplicado). Nunca aponte um anúncio abaixo de 300 impressões.
- Texto corrido inteligente, português brasileiro, sem bullets internos, sem asteriscos, sem markdown dentro dos parágrafos.
- \`status\`: "piorando" se predomina piora; "melhorando" se predomina melhora; "misto" se equilibrado.
- NÃO inclua nenhum campo \`acoes\` ou lista de ações separada — a sugestão fica embutida em cada parágrafo.
- NÃO inclua cercas \`\`\`, comentários ou texto fora do JSON.`;
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
      max_tokens: 3000,
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
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned) as AnalysisJSON;
}

// ---------- Discord embeds ----------

const FIELD_LIMIT = 1024;
const DESCRIPTION_LIMIT = 4096;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

// Junta parágrafos separados por linha em branco, truncando graciosamente.
function paragraphs(items: string[] | undefined, max = FIELD_LIMIT): string | null {
  if (!items || items.length === 0) return null;
  const clean = items.map((s) => (s || '').trim()).filter(Boolean);
  if (clean.length === 0) return null;
  let out = clean.join('\n\n');
  if (out.length <= max) return out;
  // Trunca parágrafo a parágrafo
  const kept: string[] = [];
  let total = 0;
  for (const p of clean) {
    const add = kept.length === 0 ? p.length : p.length + 2;
    if (total + add > max - 2) break;
    kept.push(p);
    total += add;
  }
  if (kept.length === 0) return truncate(clean[0], max);
  return kept.join('\n\n') + '\n…';
}

function statusBadge(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'piorando') return '🔴 Piorando';
  if (s === 'melhorando') return '🟢 Melhorando';
  if (s === 'misto') return '🟡 Misto';
  return '⚪ Sem classificação';
}

function buildOverviewEmbed(clientName: string, analysis: AnalysisJSON, hasMeta: boolean, hasGoogle: boolean) {
  const platformLabel = [hasMeta ? 'Meta' : null, hasGoogle ? 'Google' : null].filter(Boolean).join(' + ');
  return {
    title: truncate(`🤖 Análise de otimização — ${clientName}`, 256),
    description: analysis.resumo_executivo
      ? truncate(analysis.resumo_executivo, DESCRIPTION_LIMIT)
      : '_Sem resumo executivo._',
    color: 0xff6e00,
    footer: { text: `${platformLabel} · janelas 7d / 30d / 90d` },
    timestamp: new Date().toISOString(),
  };
}

function buildPlatformEmbed(
  title: string,
  color: number,
  data: PlatformAnalysis | null | undefined,
  errorNote: string | null,
) {
  const fields: Array<{ name: string; value: string }> = [];

  if (errorNote) {
    fields.push({ name: '⚠️ Observação', value: truncate(errorNote, FIELD_LIMIT) });
  }

  if (data) {
    const piorou = paragraphs(data.piorou);
    if (piorou) fields.push({ name: '📉 O que piorou (7d)', value: piorou });

    const melhorou = paragraphs(data.melhorou);
    if (melhorou) fields.push({ name: '📈 O que melhorou (7d)', value: melhorou });

    if (!piorou && !melhorou && !errorNote) {
      fields.push({ name: '_Sem pontos relevantes_', value: 'A IA não identificou variações significativas nos últimos 7 dias.' });
    }
  }

  const desc = data?.status ? statusBadge(data.status) : undefined;

  return {
    title: truncate(title, 256),
    description: desc,
    color,
    fields,
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

  const embeds: any[] = [buildOverviewEmbed(clientName, parsed, hasMeta, hasGoogle)];

  if (hasMeta) {
    const metaErr = platformErrors.meta ? 'Meta Ads: falha ao coletar métricas nesta análise.' : null;
    embeds.push(buildPlatformEmbed('📘 Meta Ads', 0x1877f2, parsed.meta ?? null, metaErr));
  }
  if (hasGoogle) {
    const gErr = platformErrors.google ? 'Google Ads: falha ao coletar métricas nesta análise (verifique acesso da conta).' : null;
    embeds.push(buildPlatformEmbed('🟡 Google Ads', 0x4285f4, parsed.google ?? null, gErr));
  }

  await editOriginal(appId, interactionToken, { embeds });
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
