// Lista anúncios ATIVOS de uma conta Meta Ads específica.
// Chamado pela página /anuncios-ativos (e potencialmente pelo bot Discord).

import { createClient } from 'npm:@supabase/supabase-js@2';

const META_API_VERSION = 'v24.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, x-client-info, apikey',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function resolveImageUrl(ad: any): string | null {
  const c = ad?.creative || {};
  if (c.image_url) return c.image_url;
  if (c.thumbnail_url) return c.thumbnail_url;
  const oss = c.object_story_spec || {};
  if (oss.link_data?.picture) return oss.link_data.picture;
  if (oss.video_data?.image_url) return oss.video_data.image_url;
  if (oss.photo_data?.url) return oss.photo_data.url;
  return null;
}

async function metaFetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let last: Response | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;
    last = res;
    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable || attempt === maxRetries) return res;
    const backoff = Math.min(10000, 1000 * Math.pow(3, attempt)) + Math.floor(Math.random() * 500);
    console.warn(`[meta-active-ads] ${res.status} — retry ${attempt + 1}/${maxRetries} em ${backoff}ms`);
    await new Promise((r) => setTimeout(r, backoff));
  }
  return last!;
}

async function fetchAllAds(accountId: string, accessToken: string, statuses: string[]) {
  const fields = [
    'name',
    'effective_status',
    'status',
    'campaign{id,name}',
    'creative{image_url,thumbnail_url,object_story_spec}',
  ].join(',');

  const statusFilter = JSON.stringify(statuses);
  let url: string | null =
    `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/ads` +
    `?effective_status=${encodeURIComponent(statusFilter)}` +
    `&limit=200&fields=${encodeURIComponent(fields)}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const all: any[] = [];
  let safety = 0;
  while (url && safety < 20) {
    safety++;
    const res = await metaFetchWithRetry(url);
    if (!res.ok) {
      const body = await res.text();
      console.error('[meta-active-ads] erro', res.status, body.slice(0, 300));
      const rateLimited = res.status === 429 || res.status >= 500;
      const err: any = new Error(
        rateLimited
          ? 'A API do Meta está com limite de requisições. Aguarde 1–2 minutos e tente novamente.'
          : (safeParseError(body) || 'Falha ao buscar anúncios'),
      );
      err.rateLimited = rateLimited;
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (Array.isArray(data.data)) all.push(...data.data);
    url = data?.paging?.next || null;
  }
  return all;
}

function safeParseError(body: string): string | null {
  try {
    const j = JSON.parse(body);
    return j?.error?.message || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const accountRowId: string | undefined = body.accountRowId;
    const statuses: string[] = Array.isArray(body.statuses) && body.statuses.length
      ? body.statuses
      : ['ACTIVE'];

    if (!accountRowId) {
      return json({ success: false, error: 'accountRowId é obrigatório' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Buscar conta + cliente
    const { data: acc, error: accErr } = await supabase
      .from('client_accounts')
      .select('account_id, account_name, platform, status, clients!inner(id, company_name, logo_url)')
      .eq('id', accountRowId)
      .maybeSingle();
    if (accErr || !acc) return json({ success: false, error: 'Conta não encontrada' }, 404);
    if (acc.platform !== 'meta') return json({ success: false, error: 'Conta não é Meta' }, 400);

    const { data: tokRow, error: tokErr } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .maybeSingle();
    if (tokErr || !tokRow?.value) return json({ success: false, error: 'Token Meta não configurado' }, 500);

    const ads = await fetchAllAds(acc.account_id as string, tokRow.value as string, statuses);

    const normalized = ads.map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      status: ad.effective_status,
      raw_status: ad.status,
      campaign_id: ad.campaign?.id || null,
      campaign_name: ad.campaign?.name || null,
      image_url: resolveImageUrl(ad),
    }));

    return json({
      success: true,
      client: (acc as any).clients,
      account: {
        id: accountRowId,
        account_id: acc.account_id,
        account_name: acc.account_name,
      },
      total: normalized.length,
      ads: normalized,
    });
  } catch (e: any) {
    console.error('[meta-active-ads] erro', e);
    const rateLimited = !!e?.rateLimited;
    return json(
      { success: false, error: e?.message || 'Erro desconhecido', rate_limited: rateLimited },
      rateLimited ? 503 : 500,
    );
  }
});
