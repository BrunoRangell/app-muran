// Executa as escritas reais no Meta e Google Ads.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getGoogleAccessToken } from './ia-targets.ts';

const META_API_VERSION = 'v24.0';
const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v21';

async function getMetaToken(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await supabase.from('api_tokens').select('value').eq('name', 'meta_access_token').maybeSingle();
  if (!data?.value) throw new Error('Token Meta não configurado');
  return data.value as string;
}

// ============== Meta ==============

export async function metaSetStatus(
  supabase: ReturnType<typeof createClient>,
  targetId: string,
  status: 'ACTIVE' | 'PAUSED',
) {
  const token = await getMetaToken(supabase);
  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${targetId}?access_token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ status }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Meta erro ${res.status}`);
  return data;
}

export async function metaSetDailyBudget(
  supabase: ReturnType<typeof createClient>,
  targetId: string,
  valorBRL: number,
) {
  const token = await getMetaToken(supabase);
  const cents = Math.round(valorBRL * 100);
  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${targetId}?access_token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ daily_budget: String(cents) }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Meta erro ${res.status}`);
  return data;
}

// ============== Google ==============

async function googleMutate(
  customerId: string,
  operations: any[],
  auth: { accessToken: string; developerToken: string; managerId?: string },
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
    'developer-token': auth.developerToken,
    'Content-Type': 'application/json',
  };
  if (auth.managerId) headers['login-customer-id'] = auth.managerId;

  const res = await fetch(`${GOOGLE_ADS_API}/customers/${customerId}/googleAds:mutate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mutateOperations: operations }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[ia-writes google] erro', JSON.stringify(data));
    throw new Error(data?.[0]?.error?.message || data?.error?.message || `Google Ads erro ${res.status}`);
  }
  return data;
}

async function getGoogleAuth() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = await getGoogleAccessToken(supabaseUrl, supabaseKey);
  if (!auth) throw new Error('Credenciais Google Ads incompletas');
  return auth;
}

export async function googleSetStatus(
  level: 'campanha' | 'adset' | 'anuncio',
  resourceName: string,
  customerId: string,
  status: 'ENABLED' | 'PAUSED',
) {
  const auth = await getGoogleAuth();
  const cust = customerId.replace(/-/g, '');

  let opKey: string;
  let updateMask: string;
  if (level === 'campanha') {
    opKey = 'campaignOperation';
    updateMask = 'status';
  } else if (level === 'adset') {
    opKey = 'adGroupOperation';
    updateMask = 'status';
  } else {
    opKey = 'adGroupAdOperation';
    updateMask = 'status';
  }

  const ops = [{
    [opKey]: {
      update: { resourceName, status },
      updateMask,
    },
  }];

  return googleMutate(cust, ops, auth);
}

export async function googleSetDailyBudget(
  campaignBudgetResource: string,
  customerId: string,
  valorBRL: number,
) {
  const auth = await getGoogleAuth();
  const cust = customerId.replace(/-/g, '');
  const micros = Math.round(valorBRL * 1_000_000);

  const ops = [{
    campaignBudgetOperation: {
      update: { resourceName: campaignBudgetResource, amountMicros: String(micros) },
      updateMask: 'amount_micros',
    },
  }];

  return googleMutate(cust, ops, auth);
}
