
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { DateTime } from 'https://esm.sh/luxon@3.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { method, clientId, tokens } = await req.json();

    console.log(`[INFO] Processando requisição: ${method}`);

    if (method === 'saveTokens') {
      // Salvar tokens na tabela api_tokens
      const { error } = await supabaseClient.from('api_tokens').upsert(
        tokens.map(({ name, value }: { name: string; value: string }) => ({
          name,
          value,
        }))
      );

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (method === 'analyzeClient') {
      console.log(`[INFO] Analisando cliente ID: ${clientId}`);
      
      // Buscar os tokens necessários
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('api_tokens')
        .select('name, value');

      if (tokenError) throw tokenError;
      
      // Mapear tokens para um objeto
      const tokens = tokenData.reduce((acc: Record<string, string>, token) => {
        acc[token.name] = token.value;
        return acc;
      }, {});

      // Verificar se os tokens necessários estão presentes
      if (!tokens.meta_access_token) {
        throw new Error('Token do Meta Ads não configurado');
      }

      // Buscar informações do cliente
      const { data: client, error: clientError } = await supabaseClient
        .from('clients')
        .select('id, company_name, meta_ads_budget')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      console.log(`[INFO] Cliente: ${client.company_name} (Orçamento: ${client.meta_ads_budget})`);

      // Se não há orçamento configurado, retornar erro
      if (!client.meta_ads_budget) {
        throw new Error('Orçamento de Meta Ads não configurado para este cliente');
      }

      let metaReview: any = {
        client_id: clientId,
        review_date: DateTime.now().toISODate(),
        meta_budget_available: client.meta_ads_budget,
      };

      try {
        // Buscar contas do Meta Ads
        const response = await fetch(
          `https://graph.facebook.com/v20.0/me/adaccounts?fields=name,account_id&access_token=${tokens.meta_access_token}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Erro na API do Meta Ads: ${JSON.stringify(errorData.error)}`);
        }

        const metaData = await response.json();
        const accounts = metaData.data;

        console.log(`[INFO] Contas Meta encontradas: ${accounts.length}`);

        // Buscar apenas conta que inclua o nome do cliente
        const normalizedClientName = normalizeText(client.company_name);
        const matchedAccounts = accounts.filter((account: any) => 
          normalizeText(account.name).includes(normalizedClientName)
        );

        if (matchedAccounts.length === 0) {
          throw new Error(`Nenhuma conta de Meta Ads encontrada para o cliente ${client.company_name}`);
        }

        // Usar a primeira conta que corresponde ao nome do cliente
        const account = matchedAccounts[0];
        metaReview.meta_account_id = account.account_id;
        metaReview.meta_account_name = account.name;

        console.log(`[INFO] Conta Meta selecionada: ${account.name} (${account.account_id})`);

        // Buscar insights (gastos) do mês atual
        const today = DateTime.now();
        const timeRange = {
          since: today.startOf('month').toISODate(),
          until: today.toISODate()
        };

        const insightsResponse = await fetch(
          `https://graph.facebook.com/v20.0/act_${account.account_id}/insights?fields=spend&time_range=${JSON.stringify(timeRange)}&access_token=${tokens.meta_access_token}`
        );
        
        if (!insightsResponse.ok) {
          const errorData = await insightsResponse.json();
          throw new Error(`Erro ao buscar insights: ${JSON.stringify(errorData.error)}`);
        }

        const insightsData = await insightsResponse.json();
        const insights = insightsData.data;

        // Calcular gastos totais
        const totalSpent = insights.reduce((sum: number, insight: any) => 
          sum + parseFloat(insight.spend || 0), 0);
        
        metaReview.meta_total_spent = totalSpent;

        console.log(`[INFO] Total gasto no Meta Ads: ${totalSpent}`);

        // Buscar campanhas para calcular orçamento diário atual
        const campaignsResponse = await fetch(
          `https://graph.facebook.com/v20.0/act_${account.account_id}/campaigns?fields=name,daily_budget,status&access_token=${tokens.meta_access_token}`
        );
        
        if (!campaignsResponse.ok) {
          const errorData = await campaignsResponse.json();
          throw new Error(`Erro ao buscar campanhas: ${JSON.stringify(errorData.error)}`);
        }

        const campaignsData = await campaignsResponse.json();
        const campaigns = campaignsData.data;

        console.log(`[INFO] Campanhas encontradas: ${campaigns.length}`);

        // Calcular orçamento diário atual (soma dos orçamentos das campanhas ativas)
        const dailyBudgetCurrent = campaigns.reduce((sum: number, campaign: any) => {
          if (campaign.status === 'ACTIVE' && campaign.daily_budget) {
            return sum + (parseFloat(campaign.daily_budget) / 100); // Meta retorna em centavos
          }
          return sum;
        }, 0);

        metaReview.meta_daily_budget_current = dailyBudgetCurrent;

        console.log(`[INFO] Orçamento diário atual: ${dailyBudgetCurrent}`);

        // Calcular orçamento diário ideal
        const daysInMonth = today.daysInMonth;
        const daysLeft = daysInMonth - today.day + 1;
        const budgetLeft = client.meta_ads_budget - totalSpent;
        const dailyBudgetIdeal = daysLeft > 0 ? budgetLeft / daysLeft : 0;

        metaReview.meta_daily_budget_ideal = dailyBudgetIdeal;

        // Gerar recomendação
        const budgetDifference = dailyBudgetIdeal - dailyBudgetCurrent;
        
        if (Math.abs(budgetDifference) < 1) {
          metaReview.meta_recommendation = "Manter o orçamento atual";
        } else if (budgetDifference > 0) {
          metaReview.meta_recommendation = `Aumentar orçamento diário em R$ ${budgetDifference.toFixed(2)}`;
        } else {
          metaReview.meta_recommendation = `Diminuir orçamento diário em R$ ${Math.abs(budgetDifference).toFixed(2)}`;
        }

        console.log(`[INFO] Recomendação: ${metaReview.meta_recommendation}`);

      } catch (error) {
        console.error(`[ERROR] Erro ao processar Meta Ads: ${error.message}`);
        metaReview.meta_error = error.message;
      }

      // Salvar a revisão no banco de dados
      const { data: reviewData, error: reviewError } = await supabaseClient
        .from('daily_budget_reviews')
        .upsert({
          client_id: clientId,
          review_date: metaReview.review_date,
          meta_account_id: metaReview.meta_account_id,
          meta_account_name: metaReview.meta_account_name,
          meta_budget_available: metaReview.meta_budget_available,
          meta_total_spent: metaReview.meta_total_spent,
          meta_daily_budget_current: metaReview.meta_daily_budget_current,
          meta_daily_budget_ideal: metaReview.meta_daily_budget_ideal,
          meta_recommendation: metaReview.meta_recommendation,
          meta_error: metaReview.meta_error,
        })
        .select();

      if (reviewError) throw reviewError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          client,
          review: reviewData[0]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não suportado' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Função utilitária para normalizar texto (remover acentos, etc.)
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toLowerCase();
}
