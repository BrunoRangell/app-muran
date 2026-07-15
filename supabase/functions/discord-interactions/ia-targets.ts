// Busca lista de alvos ativos/pausados (campanhas, adsets, anúncios) do cliente
// nas plataformas Meta e Google Ads.

import { createClient } from 'npm:@supabase/supabase-js@2';

const META_API_VERSION = 'v24.0';
const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v21';

export type Hierarchy = {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
};

export type Target = {
  platform: 'meta' | 'google';
  level: 'campanha' | 'adset' | 'anuncio';
  id: string; // id direto usado nos endpoints (Meta = numeric; Google = resource_name para writes; guardamos ambos)
  resource_name?: string; // Google
  name: string;
  status: string; // ACTIVE / PAUSED / ENABLED etc
  budget_amount?: number | null; // diário em BRL, quando aplicável
  budget_type?: 'daily' | 'lifetime' | null;
  account_id?: string;
  hierarchy?: Hierarchy;
  extra?: Record<string, any>;
};

// ============== Meta ==============

async function getMetaToken(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'meta_access_token')
    .maybeSingle();
  return (data?.value as string) || null;
}

async function metaFetch(url: string): Promise<any> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Meta API erro ${res.status}`);
  }
  return data;
}

async function fetchMetaTargetsForAccount(accountId: string, token: string): Promise<Target[]> {
  const targets: Target[] = [];
  const statusFilter = encodeURIComponent(JSON.stringify(['ACTIVE', 'PAUSED']));

  // Campanhas
  try {
    const campUrl =
      `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/campaigns` +
      `?effective_status=${statusFilter}&limit=50&fields=id,name,status,effective_status,daily_budget,lifetime_budget` +
      `&access_token=${encodeURIComponent(token)}`;
    const campData = await metaFetch(campUrl);
    for (const c of campData.data || []) {
      targets.push({
        platform: 'meta',
        level: 'campanha',
        id: c.id,
        name: c.name,
        status: c.effective_status || c.status,
        budget_amount: c.daily_budget ? Number(c.daily_budget) / 100 : c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
        budget_type: c.daily_budget ? 'daily' : c.lifetime_budget ? 'lifetime' : null,
        account_id: accountId,
      });
    }
  } catch (e) {
    console.error('[ia-targets meta campaigns]', e);
  }

  // Adsets (com campanha pai)
  try {
    const asUrl =
      `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/adsets` +
      `?effective_status=${statusFilter}&limit=50&fields=id,name,status,effective_status,daily_budget,lifetime_budget,campaign_id,campaign{id,name}` +
      `&access_token=${encodeURIComponent(token)}`;
    const asData = await metaFetch(asUrl);
    for (const a of asData.data || []) {
      targets.push({
        platform: 'meta',
        level: 'adset',
        id: a.id,
        name: a.name,
        status: a.effective_status || a.status,
        budget_amount: a.daily_budget ? Number(a.daily_budget) / 100 : a.lifetime_budget ? Number(a.lifetime_budget) / 100 : null,
        budget_type: a.daily_budget ? 'daily' : a.lifetime_budget ? 'lifetime' : null,
        account_id: accountId,
        hierarchy: {
          campaign_id: a.campaign?.id || a.campaign_id,
          campaign_name: a.campaign?.name,
        },
        extra: { campaign_id: a.campaign_id },
      });
    }
  } catch (e) {
    console.error('[ia-targets meta adsets]', e);
  }

  // Ads (com adset e campanha pais)
  try {
    const adUrl =
      `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/ads` +
      `?effective_status=${statusFilter}&limit=50&fields=id,name,status,effective_status,adset_id,campaign_id,campaign{id,name},adset{id,name}` +
      `&access_token=${encodeURIComponent(token)}`;
    const adData = await metaFetch(adUrl);
    for (const a of adData.data || []) {
      targets.push({
        platform: 'meta',
        level: 'anuncio',
        id: a.id,
        name: a.name,
        status: a.effective_status || a.status,
        account_id: accountId,
        hierarchy: {
          campaign_id: a.campaign?.id || a.campaign_id,
          campaign_name: a.campaign?.name,
          adset_id: a.adset?.id || a.adset_id,
          adset_name: a.adset?.name,
        },
        extra: { adset_id: a.adset_id, campaign_id: a.campaign_id },
      });
    }
  } catch (e) {
    console.error('[ia-targets meta ads]', e);
  }

  return targets;
}

// ============== Google ==============

export async function getGoogleAccessToken(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<{ accessToken: string; developerToken: string; managerId?: string } | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/api_tokens?name=in.(google_ads_access_token,google_ads_refresh_token,google_ads_client_id,google_ads_client_secret,google_ads_token_expiry,google_ads_developer_token,google_ads_manager_id)&select=name,value`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (!res.ok) return null;
  const rows: Array<{ name: string; value: string }> = await res.json();
  const t: Record<string, string> = {};
  rows.forEach((r) => (t[r.name] = r.value));

  if (!t.google_ads_access_token || !t.google_ads_refresh_token || !t.google_ads_client_id || !t.google_ads_client_secret || !t.google_ads_developer_token) {
    return null;
  }

  const expiry = t.google_ads_token_expiry ? parseInt(t.google_ads_token_expiry) : 0;
  const now = Math.floor(Date.now() / 1000);
  let accessToken = t.google_ads_access_token;

  if (!expiry || now > expiry - 300) {
    const refresh = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: t.google_ads_client_id,
        client_secret: t.google_ads_client_secret,
        refresh_token: t.google_ads_refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (refresh.ok) {
      const rd = await refresh.json();
      accessToken = rd.access_token;
      const newExpiry = Math.floor(Date.now() / 1000) + rd.expires_in;
      await fetch(`${supabaseUrl}/rest/v1/api_tokens?name=eq.google_ads_access_token`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ value: accessToken }),
      });
      await fetch(`${supabaseUrl}/rest/v1/api_tokens?name=eq.google_ads_token_expiry`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ value: newExpiry.toString() }),
      });
    }
  }

  return {
    accessToken,
    developerToken: t.google_ads_developer_token,
    managerId: t.google_ads_manager_id,
  };
}

async function googleAdsSearch(
  customerId: string,
  query: string,
  auth: { accessToken: string; developerToken: string; managerId?: string },
): Promise<any[]> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
    'developer-token': auth.developerToken,
    'Content-Type': 'application/json',
  };
  if (auth.managerId) headers['login-customer-id'] = auth.managerId;

  const res = await fetch(`${GOOGLE_ADS_API}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, pageSize: 200 }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.[0]?.error?.message || data?.error?.message || `Google Ads erro ${res.status}`);
  }
  return data?.results || [];
}

async function fetchGoogleTargetsForAccount(
  customerId: string,
  auth: { accessToken: string; developerToken: string; managerId?: string },
): Promise<Target[]> {
  const targets: Target[] = [];
  const cust = customerId.replace(/-/g, '');

  // Campanhas + budget
  try {
    const rows = await googleAdsSearch(
      cust,
      `SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name,
              campaign_budget.resource_name, campaign_budget.amount_micros
       FROM campaign
       WHERE campaign.status IN ('ENABLED','PAUSED')
       LIMIT 100`,
      auth,
    );
    for (const r of rows) {
      const c = r.campaign;
      const b = r.campaignBudget;
      targets.push({
        platform: 'google',
        level: 'campanha',
        id: String(c.id),
        resource_name: c.resourceName,
        name: c.name,
        status: c.status,
        budget_amount: b?.amountMicros ? Number(b.amountMicros) / 1_000_000 : null,
        budget_type: 'daily',
        account_id: cust,
        extra: { campaign_budget_resource: b?.resourceName },
      });
    }
  } catch (e) {
    console.error('[ia-targets google campaigns]', e);
  }

  // AdGroups (equivalente a "conjunto/adset")
  try {
    const rows = await googleAdsSearch(
      cust,
      `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.resource_name, campaign.id, campaign.name
       FROM ad_group
       WHERE ad_group.status IN ('ENABLED','PAUSED')
       LIMIT 100`,
      auth,
    );
    for (const r of rows) {
      const a = r.adGroup;
      targets.push({
        platform: 'google',
        level: 'adset',
        id: String(a.id),
        resource_name: a.resourceName,
        name: a.name,
        status: a.status,
        account_id: cust,
        hierarchy: {
          campaign_id: r.campaign?.id ? String(r.campaign.id) : undefined,
          campaign_name: r.campaign?.name,
        },
        extra: { campaign_id: r.campaign?.id },
      });
    }
  } catch (e) {
    console.error('[ia-targets google adgroups]', e);
  }

  // Ads
  try {
    const rows = await googleAdsSearch(
      cust,
      `SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status, ad_group_ad.resource_name,
              ad_group.id, ad_group.name, campaign.id, campaign.name
       FROM ad_group_ad
       WHERE ad_group_ad.status IN ('ENABLED','PAUSED')
       LIMIT 100`,
      auth,
    );
    for (const r of rows) {
      const a = r.adGroupAd;
      const adId = a.ad?.id || a.resourceName?.split('~').pop();
      targets.push({
        platform: 'google',
        level: 'anuncio',
        id: String(adId),
        resource_name: a.resourceName,
        name: a.ad?.name || `Ad ${adId}`,
        status: a.status,
        account_id: cust,
        hierarchy: {
          campaign_id: r.campaign?.id ? String(r.campaign.id) : undefined,
          campaign_name: r.campaign?.name,
          adset_id: r.adGroup?.id ? String(r.adGroup.id) : undefined,
          adset_name: r.adGroup?.name,
        },
        extra: { ad_group_id: r.adGroup?.id },
      });
    }
  } catch (e) {
    console.error('[ia-targets google ads]', e);
  }

  return targets;
}

// ============== Público ==============

export async function fetchTargetsForClient(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
): Promise<{ targets: Target[]; errors: string[] }> {
  const targets: Target[] = [];
  const errors: string[] = [];

  // Contas do cliente
  const { data: accounts } = await supabase
    .from('client_accounts')
    .select('id, account_id, account_name, platform, status')
    .eq('client_id', clientId)
    .eq('status', 'active');

  const metaAccounts = (accounts || []).filter((a: any) => a.platform === 'meta' && a.account_id);
  const googleAccounts = (accounts || []).filter((a: any) => a.platform === 'google' && a.account_id);

  // Meta
  if (metaAccounts.length) {
    const token = await getMetaToken(supabase);
    if (!token) {
      errors.push('Token Meta não configurado.');
    } else {
      for (const acc of metaAccounts) {
        try {
          const t = await fetchMetaTargetsForAccount(acc.account_id as string, token);
          targets.push(...t);
        } catch (e: any) {
          errors.push(`Meta (${acc.account_name || acc.account_id}): ${e.message}`);
        }
      }
    }
  }

  // Google
  if (googleAccounts.length) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const auth = await getGoogleAccessToken(supabaseUrl, supabaseKey);
    if (!auth) {
      errors.push('Credenciais Google Ads incompletas.');
    } else {
      for (const acc of googleAccounts) {
        try {
          const t = await fetchGoogleTargetsForAccount(acc.account_id as string, auth);
          targets.push(...t);
        } catch (e: any) {
          errors.push(`Google (${acc.account_name || acc.account_id}): ${e.message}`);
        }
      }
    }
  }

  // Limita a 100
  return { targets: targets.slice(0, 100), errors };
}
