// Constrói payloads de listagem (somente leitura) para /ia.
// listar_campanhas / listar_conjuntos: um embed único com linhas compactas.
// listar_anuncios: até 10 embeds, cada um com thumbnail + status + hierarquia.

import { createClient } from 'npm:@supabase/supabase-js@2';
import type { Target } from './ia-targets.ts';

const MURAN_ORANGE = 0xff6e00;
const META_API_VERSION = 'v24.0';

function statusIcon(s: string) {
  const up = (s || '').toUpperCase();
  if (up === 'ACTIVE' || up === 'ENABLED') return '🟢';
  if (up === 'PAUSED') return '⏸️';
  return '⚪';
}

function statusShort(s: string) {
  const up = (s || '').toUpperCase();
  if (up === 'ACTIVE' || up === 'ENABLED') return 'ativo';
  if (up === 'PAUSED') return 'pausado';
  return (s || '').toLowerCase();
}

function formatBRL(v: number | null | undefined) {
  if (v === null || v === undefined) return null;
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function plataformaLabel(p: string) {
  return p === 'meta' ? 'Meta' : 'Google';
}

function resolveImageUrl(ad: any): string | null {
  const c = ad?.creative || {};
  if (c.thumbnail_url) return c.thumbnail_url;
  if (c.image_url) return c.image_url;
  const oss = c.object_story_spec || {};
  if (oss.link_data?.picture) return oss.link_data.picture;
  if (oss.video_data?.image_url) return oss.video_data.image_url;
  if (oss.photo_data?.url) return oss.photo_data.url;
  return null;
}

async function getMetaToken(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data } = await supabase.from('api_tokens').select('value').eq('name', 'meta_access_token').maybeSingle();
  return (data?.value as string) || null;
}

// Busca criativos (thumbnail) de vários ads via /?ids=
async function fetchMetaAdCreatives(adIds: string[], token: string): Promise<Record<string, any>> {
  if (!adIds.length) return {};
  const fields = 'creative{image_url,thumbnail_url,object_story_spec}';
  const url =
    `https://graph.facebook.com/${META_API_VERSION}/` +
    `?ids=${encodeURIComponent(adIds.join(','))}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('[ia-listing meta creatives]', JSON.stringify(data));
      return {};
    }
    return data || {};
  } catch (e) {
    console.error('[ia-listing meta creatives] exception', e);
    return {};
  }
}

// Busca métricas (impressions/clicks/spend) dos últimos 7 dias por conta Meta.
async function fetchMetaInsightsByAccount(
  accountId: string,
  adIds: string[],
  token: string,
): Promise<Record<string, { impressions?: string; clicks?: string; spend?: string }>> {
  if (!adIds.length) return {};
  const filtering = encodeURIComponent(JSON.stringify([{ field: 'ad.id', operator: 'IN', value: adIds }]));
  const url =
    `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/insights` +
    `?level=ad&fields=ad_id,impressions,clicks,spend&date_preset=last_7d` +
    `&filtering=${filtering}&limit=100` +
    `&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('[ia-listing meta insights]', JSON.stringify(data));
      return {};
    }
    const map: Record<string, any> = {};
    for (const row of data?.data || []) {
      if (row.ad_id) map[row.ad_id] = row;
    }
    return map;
  } catch (e) {
    console.error('[ia-listing meta insights] exception', e);
    return {};
  }
}

// ============== Public builders ==============

export function filterTargets(
  targets: Target[],
  level: 'campanha' | 'adset' | 'anuncio',
  plataforma?: 'meta' | 'google' | null,
): Target[] {
  return targets.filter((t) => t.level === level && (!plataforma || t.platform === plataforma));
}

export function buildCampaignsListPayload(
  clientName: string,
  targets: Target[],
): unknown {
  const items = filterTargets(targets, 'campanha');
  if (!items.length) {
    return { content: `📭 Nenhuma campanha ativa/pausada encontrada para **${clientName}**.` };
  }
  const lines = items.slice(0, 40).map((t) => {
    const budget = formatBRL(t.budget_amount);
    const budgetTxt = budget ? ` — ${budget}/dia` : '';
    return `${statusIcon(t.status)} \`${plataformaLabel(t.platform)}\` **${t.name}** — ${statusShort(t.status)}${budgetTxt}`;
  });
  return {
    content: '',
    embeds: [
      {
        title: `📋 Campanhas — ${clientName}`,
        description: lines.join('\n').slice(0, 4000),
        color: MURAN_ORANGE,
        footer: { text: `${items.length} campanha(s)` },
      },
    ],
    components: [],
  };
}

export function buildAdSetsListPayload(clientName: string, targets: Target[]): unknown {
  const items = filterTargets(targets, 'adset');
  if (!items.length) {
    return { content: `📭 Nenhum conjunto ativo/pausado encontrado para **${clientName}**.` };
  }
  const lines = items.slice(0, 40).map((t) => {
    const budget = formatBRL(t.budget_amount);
    const budgetTxt = budget ? ` — ${budget}/dia` : '';
    const camp = t.hierarchy?.campaign_name ? ` · _${t.hierarchy.campaign_name}_` : '';
    return `${statusIcon(t.status)} \`${plataformaLabel(t.platform)}\` **${t.name}** — ${statusShort(t.status)}${budgetTxt}${camp}`;
  });
  return {
    content: '',
    embeds: [
      {
        title: `📋 Conjuntos — ${clientName}`,
        description: lines.join('\n').slice(0, 4000),
        color: MURAN_ORANGE,
        footer: { text: `${items.length} conjunto(s)` },
      },
    ],
    components: [],
  };
}

export async function buildAdsListPayload(
  supabase: ReturnType<typeof createClient>,
  clientName: string,
  targets: Target[],
): Promise<unknown> {
  const items = filterTargets(targets, 'anuncio').slice(0, 10);
  if (!items.length) {
    return { content: `📭 Nenhum anúncio ativo/pausado encontrado para **${clientName}**.` };
  }

  // Buscar thumbnails + insights para os anúncios Meta (Google não tem thumbnail simples).
  const metaItems = items.filter((t) => t.platform === 'meta');
  let creativesMap: Record<string, any> = {};
  const insightsByAd: Record<string, any> = {};

  if (metaItems.length) {
    const token = await getMetaToken(supabase);
    if (token) {
      const ids = metaItems.map((t) => t.id);
      creativesMap = await fetchMetaAdCreatives(ids, token);

      // Insights: agrupar por account_id
      const byAccount: Record<string, string[]> = {};
      for (const t of metaItems) {
        if (!t.account_id) continue;
        (byAccount[t.account_id] = byAccount[t.account_id] || []).push(t.id);
      }
      for (const [acc, adIds] of Object.entries(byAccount)) {
        const m = await fetchMetaInsightsByAccount(acc, adIds, token);
        Object.assign(insightsByAd, m);
      }
    }
  }

  const embeds = items.map((t) => {
    const parts: string[] = [];
    if (t.hierarchy?.campaign_name) parts.push(`**Campanha:** ${t.hierarchy.campaign_name}`);
    if (t.hierarchy?.adset_name) parts.push(`**Conjunto:** ${t.hierarchy.adset_name}`);
    parts.push(`${statusIcon(t.status)} ${statusShort(t.status)} · \`${plataformaLabel(t.platform)}\``);

    const ins = insightsByAd[t.id];
    if (ins) {
      const impr = ins.impressions ? Number(ins.impressions).toLocaleString('pt-BR') : null;
      const clk = ins.clicks ? Number(ins.clicks).toLocaleString('pt-BR') : null;
      const spend = ins.spend ? formatBRL(Number(ins.spend)) : null;
      const metricParts: string[] = [];
      if (impr) metricParts.push(`👁 ${impr}`);
      if (clk) metricParts.push(`🖱 ${clk}`);
      if (spend) metricParts.push(`💰 ${spend}`);
      if (metricParts.length) parts.push(`_últ. 7d:_ ${metricParts.join(' · ')}`);
    }

    const thumb = resolveImageUrl(creativesMap[t.id]);
    const embed: any = {
      title: t.name.slice(0, 256),
      description: parts.join('\n').slice(0, 2000),
      color: MURAN_ORANGE,
    };
    if (thumb) embed.thumbnail = { url: thumb };
    return embed;
  });

  return {
    content: `📋 Anúncios — **${clientName}** (${items.length}${filterTargets(targets, 'anuncio').length > items.length ? ` de ${filterTargets(targets, 'anuncio').length}` : ''})`,
    embeds,
    components: [],
  };
}
