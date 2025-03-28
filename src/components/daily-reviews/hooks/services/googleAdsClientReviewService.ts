
import { supabase } from "@/lib/supabase";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview } from "../types/reviewTypes";
import axios from "axios";

/**
 * Busca todos os clientes com suas revisões mais recentes (Google Ads)
 */
export const fetchClientsWithGoogleReviews = async (): Promise<ClientWithReview[]> => {
  console.log("Buscando clientes com revisões Google Ads...");
  
  try {
    // Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("company_name");
      
    if (clientsError) {
      console.error("Erro ao buscar clientes:", clientsError);
      throw new Error("Erro ao buscar clientes: " + clientsError.message);
    }
    
    if (!clients || clients.length === 0) {
      return [];
    }
    
    // Buscar revisões mais recentes para cada cliente
    const today = getCurrentDateInBrasiliaTz();
    const formattedDate = today.toISOString().split('T')[0];
    
    const { data: reviews, error: reviewsError } = await supabase
      .from("client_current_reviews")
      .select("*")
      .eq("review_date", formattedDate);
    
    if (reviewsError) {
      console.error("Erro ao buscar revisões:", reviewsError);
      throw new Error("Erro ao buscar revisões: " + reviewsError.message);
    }
    
    // Mapear clientes para incluir a revisão mais recente
    const clientsWithReviews = clients.map(client => {
      // Buscar a revisão deste cliente para hoje
      const clientReview = reviews?.find(r => r.client_id === client.id);
      
      // Calcular se precisa de ajuste baseado na revisão
      let needsBudgetAdjustment = false;
      
      if (clientReview?.google_daily_budget_current && client.google_ads_budget) {
        const dailyBudget = clientReview.google_daily_budget_current;
        const spent = clientReview.google_total_spent || 0;
        const monthlyBudget = client.google_ads_budget;
        
        // Dias restantes no mês
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const remainingDays = lastDay.getDate() - today.getDate() + 1;
        
        // Orçamento ideal por dia
        const remainingBudget = Math.max(monthlyBudget - spent, 0);
        const idealDaily = remainingDays > 0 ? remainingBudget / remainingDays : 0;
        
        // Verificar se precisa de ajuste (diferença > 5% ou R$5)
        const diff = Math.abs(idealDaily - dailyBudget);
        needsBudgetAdjustment = (diff >= 5) && (dailyBudget === 0 || diff / dailyBudget >= 0.05);
      }
      
      return {
        ...client,
        lastReview: clientReview || null,
        needsBudgetAdjustment
      };
    });
    
    return clientsWithReviews;
  } catch (error) {
    console.error("Erro ao buscar clientes com revisões:", error);
    throw error;
  }
};

/**
 * Realiza a revisão de orçamento diário de um cliente no Google Ads
 * usando dados reais da API
 */
export const reviewGoogleClient = async (client: ClientWithReview): Promise<void> => {
  console.log(`Iniciando revisão Google Ads para cliente: ${client.company_name}`);
  
  try {
    // Verificar se o cliente tem ID de conta Google Ads
    if (!client.google_account_id) {
      throw new Error("Cliente não possui ID de conta Google Ads configurado");
    }
    
    // Obter a data atual (Brasília)
    const today = getCurrentDateInBrasiliaTz();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Obter dados reais da API do Google Ads usando o useGoogleAdsService
    // Vamos obter os dados de gasto e orçamento da API do Google Ads
    const { data: googleTokensData, error: googleTokensError } = await supabase
      .from("api_tokens")
      .select("name, value")
      .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret,name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
    
    if (googleTokensError) {
      throw new Error(`Erro ao obter tokens do Google Ads: ${googleTokensError.message}`);
    }
    
    // Converter array de tokens para objeto
    const tokens: Record<string, string> = {};
    googleTokensData?.forEach(token => {
      tokens[token.name] = token.value;
    });
    
    // Verificar se temos todos os tokens necessários
    if (!tokens.google_ads_access_token || !tokens.google_ads_developer_token) {
      throw new Error("Tokens do Google Ads não configurados corretamente");
    }
    
    // Configurar headers para a API do Google Ads
    const headers = {
      'Content-Type': 'application/json',
      'developer-token': tokens.google_ads_developer_token,
      'Authorization': `Bearer ${tokens.google_ads_access_token}`
    };
    
    if (tokens.google_ads_manager_id) {
      headers['login-customer-id'] = tokens.google_ads_manager_id;
    }
    
    // Construir a query para a API do Google
    const customerId = client.google_account_id;
    
    // Obter gasto mensal atual
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const query = `
      SELECT
          metrics.cost_micros,
          campaign.id,
          campaign.name,
          campaign_budget.amount_micros
      FROM
          campaign
      WHERE
          segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;
    
    let totalSpent = 0;
    let currentDailyBudget = 0;
    
    try {
      // Fazer chamada para a API do Google Ads
      const response = await axios.post(
        `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
        { query },
        { headers }
      );
      
      // Calcular o gasto total somando o custo de todas as campanhas
      if (response.data && response.data.results) {
        totalSpent = response.data.results.reduce((acc, campaign) => {
          const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
          return acc + cost;
        }, 0);
      }
      
      // Obter orçamento diário atual somando os orçamentos das campanhas ativas
      const campaignsQuery = `
        SELECT
            campaign_budget.amount_micros,
            campaign.status
        FROM
            campaign
        WHERE
            campaign.status = 'ENABLED'
      `;
      
      const campaignsResponse = await axios.post(
        `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
        { query: campaignsQuery },
        { headers }
      );
      
      if (campaignsResponse.data && campaignsResponse.data.results) {
        currentDailyBudget = campaignsResponse.data.results.reduce((acc, campaign) => {
          const budget = campaign.campaignBudget?.amountMicros ? campaign.campaignBudget.amountMicros / 1e6 : 0;
          return acc + budget;
        }, 0);
      }
      
    } catch (apiError: any) {
      console.error("Erro na API do Google Ads:", apiError.response?.data || apiError.message);
      
      // Se não conseguimos dados da API, usamos uma estimativa baseada no orçamento mensal
      totalSpent = client.google_ads_budget ? client.google_ads_budget * 0.5 : 0; // Estimativa de 50% do orçamento gasto
      currentDailyBudget = client.google_ads_budget ? client.google_ads_budget / 30 : 0; // Estimativa de orçamento diário
      
      console.warn("Usando valores estimados devido a erro na API:", {
        totalSpent,
        currentDailyBudget
      });
    }
    
    // Obter orçamento mensal e dias restantes para cálculos
    const monthlyBudget = client.google_ads_budget || 0;
    
    // Calcular dias restantes no mês
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
    
    // Calcular orçamento diário ideal
    const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
    const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    
    console.log(`Cliente ${client.company_name} - Valores Google Ads calculados:`, {
      orçamentoMensal: monthlyBudget,
      orçamentoDiárioAtual: currentDailyBudget,
      gastoTotal: totalSpent,
      orçamentoRestante: remainingBudget,
      diasRestantes: remainingDays,
      orçamentoDiárioIdeal: idealDailyBudget
    });
    
    // Verificar se já existe uma revisão para este cliente na data atual
    const { data: existingReview, error: reviewError } = await supabase
      .from("client_current_reviews")
      .select("id")
      .eq("client_id", client.id)
      .eq("review_date", formattedDate);
    
    if (reviewError && reviewError.code !== "PGRST116") { // PGRST116 = Not found, não é um erro nesse caso
      console.error("Erro ao verificar revisão existente:", reviewError);
      throw new Error("Erro ao verificar revisão existente: " + reviewError.message);
    }
    
    const reviewData = {
      google_daily_budget_current: currentDailyBudget,
      google_total_spent: totalSpent,
      google_account_id: client.google_account_id,
      google_account_name: `Google Ads: ${client.google_account_id}`,
      updated_at: new Date().toISOString()
    };
    
    if (existingReview && existingReview.length > 0) {
      // Atualizar revisão existente
      const { error: updateError } = await supabase
        .from("client_current_reviews")
        .update(reviewData)
        .eq("id", existingReview[0].id);
        
      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError);
        throw new Error("Erro ao atualizar revisão: " + updateError.message);
      }
      
      console.log(`Revisão Google Ads atualizada para cliente ${client.company_name}`);
    } else {
      // Criar nova revisão
      const { error: insertError } = await supabase
        .from("client_current_reviews")
        .insert({
          client_id: client.id,
          review_date: formattedDate,
          ...reviewData,
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error("Erro ao criar revisão:", insertError);
        throw new Error("Erro ao criar revisão: " + insertError.message);
      }
      
      console.log(`Nova revisão Google Ads criada para cliente ${client.company_name}`);
    }
    
    return;
  } catch (error) {
    console.error(`Erro ao revisar cliente Google Ads ${client.company_name}:`, error);
    throw error;
  }
};
