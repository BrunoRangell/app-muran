import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { method } = payload

    console.log("Payload received:", payload)

    let data;
    if (method === "getMetaAdsData") {
      data = await getMetaAdsData(payload);
    } else {
      throw new Error("Method not supported");
    }

    console.log("Response data:", data)

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Function error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

// Função para obter dados atualizados do Meta Ads
const getMetaAdsData = async (payload: any) => {
  const { accessToken, metaAccountId, clientId, clientName, reviewDate, dateRange } = payload;
  
  console.log("Obtendo dados do Meta Ads para o cliente:", clientName);
  console.log("ID da conta Meta:", metaAccountId);
  console.log("Período de análise:", dateRange);

  if (!accessToken) {
    throw new Error("Token de acesso do Meta Ads não fornecido");
  }
  
  if (!metaAccountId) {
    throw new Error("ID da conta Meta Ads não configurado para o cliente");
  }

  try {
    // Construir URL para consulta de insights para o período especificado
    let startDate = dateRange?.start;
    let endDate = dateRange?.end;
    
    // Se não houver intervalo de datas especificado, usar o mês atual
    if (!startDate || !endDate) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
    }
    
    console.log("Período efetivo de análise:", startDate, "a", endDate);
    
    // Base da URL da API Graph
    const baseUrl = "https://graph.facebook.com/v18.0";
    
    // 1. Primeiro obtemos detalhes da conta para o orçamento diário
    const accountUrl = `${baseUrl}/${metaAccountId}?fields=name,daily_spend_limit&access_token=${accessToken}`;
    console.log("Consultando detalhes da conta Meta Ads");
    
    const accountResponse = await fetch(accountUrl);
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error("Erro na resposta da API Meta Ads (detalhes da conta):", errorText);
      throw new Error(`Falha ao obter detalhes da conta: ${accountResponse.statusText}`);
    }
    
    const accountData = await accountResponse.json();
    console.log("Detalhes da conta recebidos:", JSON.stringify(accountData, null, 2));
    
    // 2. Obtemos campanhas ativas e seus gastos
    // Construir URL para insights com nível de detalhes necessário
    const insightsUrl = `${baseUrl}/${metaAccountId}/insights?fields=spend&level=account&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${accessToken}`;
    console.log("Consultando insights da conta");
    
    const insightsResponse = await fetch(insightsUrl);
    if (!insightsResponse.ok) {
      const errorText = await insightsResponse.text();
      console.error("Erro na resposta da API Meta Ads (insights):", errorText);
      throw new Error(`Falha ao obter insights: ${insightsResponse.statusText}`);
    }
    
    const insightsData = await insightsResponse.json();
    console.log("Insights recebidos:", JSON.stringify(insightsData, null, 2));
    
    // 3. Obter campanhas ativas
    const campaignsUrl = `${baseUrl}/${metaAccountId}/campaigns?fields=name,status,insights{spend}&limit=50&access_token=${accessToken}`;
    console.log("Consultando campanhas");
    
    const campaignsResponse = await fetch(campaignsUrl);
    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error("Erro na resposta da API Meta Ads (campanhas):", errorText);
      throw new Error(`Falha ao obter campanhas: ${campaignsResponse.statusText}`);
    }
    
    const campaignsData = await campaignsResponse.json();
    console.log("Campanhas recebidas:", JSON.stringify(campaignsData, null, 2));
    
    // Calcular total gasto com base nos insights
    let totalSpent = 0;
    if (insightsData && insightsData.data && insightsData.data.length > 0) {
      totalSpent = parseFloat(insightsData.data[0].spend || "0");
    }
    
    // Obter orçamento diário da conta
    let dailyBudget = 0;
    if (accountData && accountData.daily_spend_limit) {
      // A API retorna em centavos, então dividimos por 100 para obter reais
      dailyBudget = parseFloat(accountData.daily_spend_limit) / 100;
    } else {
      // Se não encontrarmos um limite diário, usamos um valor padrão (opcional)
      dailyBudget = 100; // Valor padrão em reais
      console.log("Aviso: Limite diário não encontrado, usando valor padrão de R$100");
    }
    
    // Processar campanhas para ter os gastos
    const campaigns = [];
    if (campaignsData && campaignsData.data) {
      for (const campaign of campaignsData.data) {
        let campaignSpend = 0;
        
        // Tentar obter o gasto da campanha dos insights
        if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
          campaignSpend = parseFloat(campaign.insights.data[0].spend || "0");
        }
        
        campaigns.push({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          spend: campaignSpend
        });
      }
    }
    
    console.log(`Total gasto no período: R$${totalSpent}`);
    console.log(`Orçamento diário: R$${dailyBudget}`);
    console.log(`Total de campanhas: ${campaigns.length}`);
    
    // Verificar se os dados existem na tabela
    const supabaseAdmin = getSupabaseAdmin();
    
    // Verificar se já existe uma análise para esta data e cliente
    const { data: existingReview, error: queryError } = await supabaseAdmin
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', clientId)
      .eq('review_date', reviewDate)
      .maybeSingle();
    
    if (queryError) {
      console.error("Erro ao verificar revisão existente:", queryError);
      // Continuar mesmo com erro
    }
    
    let reviewId;
    
    if (existingReview) {
      // Atualizar revisão existente
      console.log("Atualizando revisão existente:", existingReview.id);
      
      const { error: updateError } = await supabaseAdmin.rpc(
        'update_daily_budget_review',
        {
          p_id: existingReview.id,
          p_meta_daily_budget_current: dailyBudget,
          p_meta_total_spent: totalSpent
        }
      );
      
      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError);
        throw new Error(`Falha ao atualizar revisão: ${updateError.message}`);
      }
      
      reviewId = existingReview.id;
      
    } else {
      // Inserir nova revisão
      console.log("Inserindo nova revisão para o cliente:", clientId);
      
      const { data: insertResult, error: insertError } = await supabaseAdmin.rpc(
        'insert_daily_budget_review',
        {
          p_client_id: clientId,
          p_review_date: reviewDate,
          p_meta_daily_budget_current: dailyBudget,
          p_meta_total_spent: totalSpent,
          p_meta_account_id: metaAccountId,
          p_meta_account_name: accountData.name || clientName
        }
      );
      
      if (insertError) {
        console.error("Erro ao inserir revisão:", insertError);
        throw new Error(`Falha ao inserir revisão: ${insertError.message}`);
      }
      
      reviewId = insertResult;
    }
    
    console.log("Análise concluída com sucesso, ID:", reviewId);
    
    // Montar resultado com todos os dados obtidos
    return {
      success: true,
      reviewId,
      client: {
        id: clientId,
        company_name: clientName,
        meta_account_id: metaAccountId
      },
      meta: {
        dailyBudget,
        totalSpent,
        accountId: metaAccountId,
        dateRange: {
          start: startDate,
          end: endDate
        },
        campaigns
      },
      message: "Análise de orçamento realizada com sucesso"
    };
    
  } catch (error) {
    console.error("Erro ao obter dados do Meta Ads:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Erro desconhecido ao conectar com a API do Meta Ads";
    
    // Retornar erro de forma estruturada
    return {
      success: false,
      meta: {
        dailyBudget: 0,
        totalSpent: 0,
        accountId: metaAccountId,
        dateRange: dateRange || { start: "", end: "" },
        campaigns: []
      },
      message: `Erro: ${errorMessage}`
    };
  }
};
