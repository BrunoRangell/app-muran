import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightRequest, createCorsResponse } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar token Meta Ads
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .single();

    if (tokenError || !tokenData?.value) {
      console.error('Erro ao buscar token Meta Ads:', tokenError);
      return createCorsResponse([]);
    }

    const metaAccessToken = tokenData.value;

    // Buscar clientes e contas Meta ativas
    const { data: accounts, error: accountsError } = await supabase
      .from('client_accounts')
      .select('account_id, clients!inner(company_name)')
      .eq('platform', 'meta')
      .eq('status', 'active')
      .eq('clients.status', 'active');

    if (accountsError || !accounts) {
      console.error('Erro ao buscar contas Meta:', accountsError);
      return createCorsResponse([]);
    }

    const results: Array<{ client: string; meta: any; google: null }> = [];

    for (const acc of accounts as any[]) {
      const accountId = acc.account_id;
      const clientName = acc.clients?.company_name || 'Desconhecido';

      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/act_${accountId}?fields=name,account_id,balance,currency,expired_funding_source_details,is_prepay_account,spend_cap,amount_spent&access_token=${metaAccessToken}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error(`Erro da API Meta (${response.status}):`, errorData?.error?.message || 'Erro');
          results.push({ client: clientName, meta: null, google: null });
          continue;
        }

        const accountData = await response.json();

        let lastFundingEvent = null;
        if (accountData.is_prepay_account === false) {
          const fundingRes = await fetch(
            `https://graph.facebook.com/v18.0/act_${accountId}/funding_events?limit=1&access_token=${metaAccessToken}`
          );
          if (fundingRes.ok) {
            const fundingData = await fundingRes.json().catch(() => null);
            lastFundingEvent = fundingData?.data?.[0] ?? null;
          } else {
            const errorData = await fundingRes.json().catch(() => null);
            console.error(`Erro da API Meta (funding events ${fundingRes.status}):`, errorData?.error?.message || 'Erro');
          }
        }

        const normalizedData = {
          id: accountData.account_id ?? accountId,
          name: accountData.name,
          balance: accountData.balance,
          currency: accountData.currency,
          is_prepay_account: accountData.is_prepay_account,
          spend_cap: accountData.spend_cap,
          amount_spent: accountData.amount_spent,
          expired_funding_source_details: accountData.expired_funding_source_details,
          last_funding_event: lastFundingEvent,
        };

        results.push({ client: clientName, meta: normalizedData, google: null });
      } catch (apiError) {
        console.error(`Erro ao consultar conta Meta ${accountId}:`, apiError);
        results.push({ client: clientName, meta: null, google: null });
      }
    }

    return createCorsResponse(results);
  } catch (error) {
    console.error('Erro na função meta-balance:', error);
    return createCorsResponse([]);
  }
});

