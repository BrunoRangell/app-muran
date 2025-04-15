
import { supabase } from "@/lib/supabase";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview, GoogleAccount } from "../types/reviewTypes";
import axios from "axios";

export const fetchClientsWithGoogleReviews = async (): Promise<ClientWithReview[]> => {
  console.log("Buscando clientes com revisões Google Ads...");
  
  try {
    // Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("company_name");
      
    if (clientsError) throw new Error("Erro ao buscar clientes: " + clientsError.message);
    if (!clients || clients.length === 0) return [];
    
    // Buscar contas Google Ads para cada cliente
    const { data: googleAccounts, error: accountsError } = await supabase
      .from("client_google_accounts")
      .select("*")
      .in("client_id", clients.map(c => c.id))
      .eq("status", "active");
      
    if (accountsError) throw new Error("Erro ao buscar contas Google: " + accountsError.message);
    
    // Buscar as revisões mais recentes
    const { data: reviews, error: reviewsError } = await supabase
      .from("google_ads_reviews")
      .select("*")
      .in("client_id", clients.map(c => c.id))
      .order("review_date", { ascending: false })
      .order("updated_at", { ascending: false });
    
    if (reviewsError) throw new Error("Erro ao buscar revisões: " + reviewsError.message);
    
    // Criar mapa de revisões mais recentes por cliente
    const latestReviewsMap = new Map();
    const reviewsByClientMap = new Map();
    
    if (reviews && reviews.length > 0) {
      // Agrupar revisões por cliente
      reviews.forEach(review => {
        const clientId = review.client_id;
        const clientReviews = reviewsByClientMap.get(clientId) || [];
        clientReviews.push(review);
        reviewsByClientMap.set(clientId, clientReviews);
        
        // Encontrar a revisão mais recente para cada cliente
        const key = `${review.client_id}`;
        if (!latestReviewsMap.has(key) || 
            new Date(review.review_date) > new Date(latestReviewsMap.get(key).review_date) ||
            (new Date(review.review_date).getTime() === new Date(latestReviewsMap.get(key).review_date).getTime() && 
             new Date(review.updated_at) > new Date(latestReviewsMap.get(key).updated_at))) {
          latestReviewsMap.set(key, review);
        }
      });
    }
    
    // Agrupar contas por cliente
    const accountsByClient = new Map<string, GoogleAccount[]>();
    googleAccounts?.forEach(account => {
      const accounts = accountsByClient.get(account.client_id) || [];
      accounts.push(account);
      accountsByClient.set(account.client_id, accounts);
    });
    
    // Mapear clientes com suas contas e revisões
    const clientsWithReviews = clients.map(client => {
      const clientAccounts = accountsByClient.get(client.id) || [];
      const latestReview = latestReviewsMap.get(client.id);
      const allClientReviews = reviewsByClientMap.get(client.id) || [];
      
      // Se o cliente não tiver contas configuradas, usar dados legados
      if (clientAccounts.length === 0 && client.google_account_id) {
        clientAccounts.push({
          id: 'legacy',
          client_id: client.id,
          account_id: client.google_account_id,
          account_name: 'Conta Principal',
          budget_amount: client.google_ads_budget || 0,
          is_primary: true,
          status: 'active',
          created_at: '',
          updated_at: ''
        });
      }
      
      // Verificar ajustes necessários para cada conta
      const needsBudgetAdjustment = clientAccounts.some(account => {
        // Encontrar revisão para esta conta específica
        const accountReview = allClientReviews.find(r => r.client_account_id === account.id);
        if (!accountReview) return false;
        
        const dailyBudget = accountReview.google_daily_budget_current || 0;
        const spent = accountReview.google_total_spent || 0;
        const monthlyBudget = account.budget_amount;
        
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const remainingDays = lastDay.getDate() - today.getDate() + 1;
        
        const remainingBudget = Math.max(monthlyBudget - spent, 0);
        const idealDaily = remainingDays > 0 ? remainingBudget / remainingDays : 0;
        
        const diff = Math.abs(idealDaily - dailyBudget);
        return (diff >= 5) && (dailyBudget === 0 || diff / dailyBudget >= 0.05);
      });
      
      return {
        ...client,
        google_accounts: clientAccounts,
        lastReview: latestReview || null,
        google_reviews: allClientReviews,
        needsBudgetAdjustment
      };
    });
    
    return clientsWithReviews;
  } catch (error) {
    console.error("Erro ao buscar clientes com revisões:", error);
    throw error;
  }
};

export const reviewGoogleClient = async (client: ClientWithReview, accountId?: string): Promise<void> => {
  try {
    // Se não foi especificada uma conta, revisar todas as contas do cliente
    const accountsToReview = accountId 
      ? client.google_accounts?.filter(a => a.id === accountId)
      : client.google_accounts;
      
    if (!accountsToReview || accountsToReview.length === 0) {
      throw new Error("Nenhuma conta Google Ads encontrada para revisão");
    }
    
    // Obter tokens da API do Google Ads
    const { data: googleTokensData, error: googleTokensError } = await supabase
      .from("api_tokens")
      .select("name, value")
      .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret,name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
    
    if (googleTokensError) {
      throw new Error(`Erro ao obter tokens do Google Ads: ${googleTokensError.message}`);
    }
    
    const tokens: Record<string, string> = {};
    googleTokensData?.forEach(token => {
      tokens[token.name] = token.value;
    });
    
    // Verificar tokens necessários
    if (!tokens.google_ads_access_token || !tokens.google_ads_developer_token) {
      throw new Error("Tokens do Google Ads não configurados corretamente");
    }
    
    // Configurar headers para a API
    const headers = {
      'Content-Type': 'application/json',
      'developer-token': tokens.google_ads_developer_token,
      'Authorization': `Bearer ${tokens.google_ads_access_token}`
    };
    
    if (tokens.google_ads_manager_id) {
      headers['login-customer-id'] = tokens.google_ads_manager_id;
    }
    
    const today = getCurrentDateInBrasiliaTz();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Revisar cada conta
    for (const account of accountsToReview) {
      // Verificar se já existe uma revisão para esta conta e data
      const { data: existingReview, error: existingReviewError } = await supabase
        .from("google_ads_reviews")
        .select("id")
        .eq("client_id", client.id)
        .eq("client_account_id", account.id)
        .eq("review_date", formattedDate)
        .maybeSingle();
        
      if (existingReviewError) {
        console.warn(`Erro ao verificar revisão existente: ${existingReviewError.message}`);
      }
      
      if (existingReview) {
        console.log(`Já existe uma revisão para o cliente ${client.company_name}, conta ${account.account_name} na data ${formattedDate}`);
        continue; // Pular para a próxima conta
      }
      
      // Construir a query para a API do Google Ads
      const customerId = account.account_id;
      
      // Obter gasto mensal atual
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Calcular data de início para os últimos 5 dias (excluindo hoje)
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      
      const fiveDaysAgoDate = fiveDaysAgo.toISOString().split('T')[0];
      const yesterdayFormattedDate = yesterdayDate.toISOString().split('T')[0];
      
      const query = `
        SELECT
            metrics.cost_micros,
            campaign.id,
            campaign.name,
            campaign_budget.amount_micros,
            segments.date
        FROM
            campaign
        WHERE
            segments.date BETWEEN '${startDate}' AND '${endDate}'
      `;
      
      let totalSpent = 0;
      let lastFiveDaysSpent = 0;
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
          // Processar resultados para calcular gastos
          response.data.results.forEach(campaign => {
            const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
            const date = campaign.segments?.date;
            
            // Adicionar ao gasto total
            totalSpent += cost;
            
            // Verificar se está dentro dos últimos 5 dias (excluindo hoje)
            if (date && date >= fiveDaysAgoDate && date <= yesterdayFormattedDate) {
              lastFiveDaysSpent += cost;
            }
          });
        }
        
        // Calcular a média diária dos últimos 5 dias
        lastFiveDaysSpent = lastFiveDaysSpent / 5;
        
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
        throw new Error(`Erro na API do Google Ads: ${apiError.response?.data?.error?.message || apiError.message}`);
      }
      
      // Obter orçamento mensal e dias restantes para cálculos
      const monthlyBudget = account.budget_amount;
      
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
        gastoMédiaCincoDias: lastFiveDaysSpent,
        orçamentoRestante: remainingBudget,
        diasRestantes: remainingDays,
        orçamentoDiárioIdeal: idealDailyBudget
      });
      
      // Salvar revisão com informações da conta específica
      const reviewData = {
        client_id: client.id,
        client_account_id: account.id,
        account_display_name: account.account_name,
        review_date: formattedDate,
        google_daily_budget_current: currentDailyBudget,
        google_total_spent: totalSpent,
        google_last_five_days_spent: lastFiveDaysSpent,
        google_account_id: account.account_id,
        google_account_name: account.account_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from("google_ads_reviews")
        .insert(reviewData);
        
      if (insertError) {
        throw new Error(`Erro ao salvar revisão: ${insertError.message}`);
      }
    }
    
  } catch (error) {
    console.error(`Erro ao revisar cliente Google Ads ${client.company_name}:`, error);
    throw error;
  }
};
