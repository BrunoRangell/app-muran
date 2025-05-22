
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";

// Função para verificar e possivelmente atualizar o token de acesso
async function ensureValidToken(supabaseUrl: string, supabaseKey: string) {
  try {
    console.log("Verificando status do token de acesso do Google Ads");
    
    // Obter tokens da API do Google Ads
    const tokenResponse = await fetch(
      `${supabaseUrl}/rest/v1/api_tokens?name=in.(google_ads_access_token,google_ads_refresh_token,google_ads_client_id,google_ads_client_secret,google_ads_token_expiry)&select=name,value`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Erro ao buscar tokens: ${tokenResponse.statusText}`);
    }
    
    const tokensData = await tokenResponse.json();
    const tokens: Record<string, string> = {};
    
    tokensData.forEach((token: { name: string; value: string }) => {
      tokens[token.name] = token.value;
    });
    
    // Verificar se temos todos os tokens necessários
    if (!tokens.google_ads_access_token || !tokens.google_ads_refresh_token || 
        !tokens.google_ads_client_id || !tokens.google_ads_client_secret) {
      throw new Error("Configuração de tokens incompleta");
    }
    
    // Verificar expiração do token atual
    const tokenExpiry = tokens.google_ads_token_expiry ? parseInt(tokens.google_ads_token_expiry) : 0;
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Se o token expirou ou expirará em menos de 5 minutos
    if (!tokenExpiry || currentTime > (tokenExpiry - 300)) {
      console.log("Token de acesso expirado ou prestes a expirar. Atualizando...");
      
      // Solicitar novo token usando o refresh token
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: tokens.google_ads_client_id,
          client_secret: tokens.google_ads_client_secret,
          refresh_token: tokens.google_ads_refresh_token,
          grant_type: "refresh_token"
        })
      });
      
      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.text();
        console.error("Erro ao atualizar token:", errorData);
        throw new Error(`Erro ao atualizar token de acesso: ${refreshResponse.statusText}`);
      }
      
      const refreshData = await refreshResponse.json();
      
      // Calcular nova data de expiração
      const newExpiry = Math.floor(Date.now() / 1000) + refreshData.expires_in;
      
      // Atualizar o token de acesso no banco de dados
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/api_tokens?name=eq.google_ads_access_token`, {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          value: refreshData.access_token
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Erro ao atualizar token de acesso no banco de dados: ${updateResponse.statusText}`);
      }
      
      // Atualizar a data de expiração no banco de dados
      const expiryUpdateResponse = await fetch(
        `${supabaseUrl}/rest/v1/api_tokens?name=eq.google_ads_token_expiry`, {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          value: newExpiry.toString()
        })
      });
      
      if (!expiryUpdateResponse.ok) {
        console.warn("Erro ao atualizar data de expiração:", expiryUpdateResponse.statusText);
      }
      
      // Atualizar o token local
      tokens.google_ads_access_token = refreshData.access_token;
      console.log("Token atualizado com sucesso");
    } else {
      console.log("Token de acesso ainda é válido");
    }
    
    return tokens.google_ads_access_token;
  } catch (error) {
    console.error("Erro no processo de verificação/atualização do token:", error);
    throw error;
  }
}

// Função para processar as revisões do Google Ads
async function processGoogleReview(req: Request) {
  try {
    const { clientId, googleAccountId, reviewDate = new Date().toISOString().split("T")[0] } = await req.json();

    if (!clientId) {
      return { success: false, error: "ID do cliente é obrigatório" };
    }

    console.log(`Processando revisão do Google Ads para cliente ${clientId} na data ${reviewDate}`);
    
    // URL da API do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: "Configuração do Supabase incompleta" };
    }

    // Buscar dados do cliente
    const clientResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}&select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!clientResponse.ok) {
      throw new Error(`Erro ao buscar cliente: ${clientResponse.statusText}`);
    }

    const clients = await clientResponse.json();
    if (!clients || clients.length === 0) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const client = clients[0];
    
    // Buscar conta do Google Ads específica se fornecida
    let accountId = googleAccountId || client.google_account_id;
    let accountName = "Conta Principal";
    let budgetAmount = client.google_ads_budget || 0;
    
    if (googleAccountId) {
      const accountResponse = await fetch(
        `${supabaseUrl}/rest/v1/client_google_accounts?client_id=eq.${clientId}&account_id=eq.${googleAccountId}&select=*`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (accountResponse.ok) {
        const accounts = await accountResponse.json();
        if (accounts && accounts.length > 0) {
          accountName = accounts[0].account_name || "Conta Google";
          budgetAmount = accounts[0].budget_amount || client.google_ads_budget || 0;
        }
      }
    }

    // Verificar se existe um orçamento personalizado ativo
    const today = new Date().toISOString().split('T')[0];
    const customBudgetResponse = await fetch(
      `${supabaseUrl}/rest/v1/custom_budgets?client_id=eq.${clientId}&is_active=eq.true&platform=eq.google&start_date=lte.${today}&end_date=gte.${today}&order=created_at.desc&limit=1`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });

    let customBudget = null;
    const usingCustomBudget = customBudgetResponse.ok;
    
    if (customBudgetResponse.ok) {
      const customBudgets = await customBudgetResponse.json();
      if (customBudgets && customBudgets.length > 0) {
        customBudget = customBudgets[0];
        budgetAmount = customBudget.budget_amount || budgetAmount;
        
        console.log(`Usando orçamento personalizado (ID: ${customBudget.id}) - Valor: ${budgetAmount}`);
      }
    }

    console.log(`Usando orçamento personalizado: ${!!customBudget}`);
    console.log(`Orçamento usado: ${budgetAmount} para conta ${accountName} (${accountId})`);

    // Verificar revisão existente
    const existingReviewResponse = await fetch(
      `${supabaseUrl}/rest/v1/google_ads_reviews?client_id=eq.${clientId}&google_account_id=eq.${accountId}&review_date=eq.${reviewDate}&select=id`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });
    
    const existingReviews = await existingReviewResponse.json();
    let reviewId;
    
    // Assegurar que temos um token de acesso válido
    const accessToken = await ensureValidToken(supabaseUrl, supabaseKey);
    
    // Obter tokens da API do Google Ads
    const googleTokensResponse = await fetch(
      `${supabaseUrl}/rest/v1/api_tokens?name=in.(google_ads_developer_token,google_ads_manager_id)&select=name,value`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!googleTokensResponse.ok) {
      throw new Error(`Erro ao buscar tokens do Google Ads: ${googleTokensResponse.statusText}`);
    }
    
    const googleTokensData = await googleTokensResponse.json();
    const googleTokens: Record<string, string> = {
      google_ads_access_token: accessToken
    };
    
    googleTokensData.forEach((token: { name: string; value: string }) => {
      googleTokens[token.name] = token.value;
    });
    
    if (!googleTokens.google_ads_access_token || !googleTokens.google_ads_developer_token) {
      throw new Error("Tokens do Google Ads não configurados corretamente");
    }
    
    // Configurar valores para armazenar os dados da API
    let totalSpent = 0;
    let lastFiveDaysSpent = 0;
    let currentDailyBudget = 0;
    let hasData = false;
    
    try {
      // Configurar headers para a API do Google Ads
      const headers = {
        'Authorization': `Bearer ${googleTokens.google_ads_access_token}`,
        'developer-token': googleTokens.google_ads_developer_token,
        'Content-Type': 'application/json'
      };
      
      if (googleTokens.google_ads_manager_id) {
        headers['login-customer-id'] = googleTokens.google_ads_manager_id;
      }
      
      // Calcular datas para query
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Calcular período dos últimos 5 dias (excluindo hoje)
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      
      const fiveDaysAgoDate = fiveDaysAgo.toISOString().split('T')[0];
      const yesterdayFormattedDate = yesterdayDate.toISOString().split('T')[0];
      
      // Query aprimorada para obter gastos do mês atual com informações por dia
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
      
      console.log(`Consultando API do Google Ads para a conta ${accountId}, período: ${startDate} a ${endDate}`);
      
      // Fazer chamada para a API do Google Ads
      const response = await fetch(
        `https://googleads.googleapis.com/v18/customers/${accountId}/googleAds:search`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ query })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error?.message || response.statusText;
        console.error("Erro na API do Google Ads:", errorData);
        throw new Error(`Erro na API do Google Ads: ${errorMessage}`);
      }
      
      const data = await response.json();
      
      // Variáveis para rastrear gastos por dia
      let dailySpends: Record<string, number> = {};
      
      // Calcular o gasto total e rastrear gastos por dia
      if (data && data.results && data.results.length > 0) {
        hasData = true;
        console.log(`Encontrados ${data.results.length} resultados de gastos para a conta ${accountId}`);
        
        // Processar resultados para calcular gastos
        data.results.forEach((campaign: any) => {
          const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
          const date = campaign.segments?.date;
          
          // Adicionar ao gasto total
          totalSpent += cost;
          
          // Rastrear gasto por dia para calcular média dos últimos 5 dias
          if (date) {
            if (!dailySpends[date]) {
              dailySpends[date] = 0;
            }
            dailySpends[date] += cost;
          }
        });
        
        console.log(`Gasto total para o mês atual: ${totalSpent.toFixed(2)}`);
        console.log("Gastos diários:", dailySpends);
      } else {
        console.log("Nenhum resultado de gasto encontrado para este período");
      }
      
      // Calcular a média dos últimos 5 dias (excluindo hoje)
      let totalDaysWithData = 0;
      let totalSpentLastFiveDays = 0;
      
      // Percorrer do dia anterior até 5 dias atrás
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (dailySpends[dateStr] !== undefined) {
          totalSpentLastFiveDays += dailySpends[dateStr];
          totalDaysWithData++;
        }
      }
      
      // Calcular a média diária dos últimos 5 dias, mas só se tivermos pelo menos um dia com dados
      if (totalDaysWithData > 0) {
        lastFiveDaysSpent = totalSpentLastFiveDays / totalDaysWithData;
        console.log(`Média de gastos dos últimos ${totalDaysWithData} dias (excluindo hoje): ${lastFiveDaysSpent.toFixed(2)}`);
      } else {
        console.log("Sem dados suficientes para calcular a média dos últimos 5 dias");
      }
      
      // Query aprimorada para obter orçamentos das campanhas ativas
      const campaignsQuery = `
        SELECT
            campaign_budget.amount_micros,
            campaign.status,
            campaign.name,
            campaign.id
        FROM
            campaign
        WHERE
            campaign.status = 'ENABLED'
      `;
      
      console.log(`Consultando orçamentos das campanhas ativas para a conta ${accountId}`);
      
      const campaignsResponse = await fetch(
        `https://googleads.googleapis.com/v18/customers/${accountId}/googleAds:search`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ query: campaignsQuery })
        }
      );
      
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        
        if (campaignsData && campaignsData.results && campaignsData.results.length > 0) {
          console.log(`Encontradas ${campaignsData.results.length} campanhas ativas`);
          
          currentDailyBudget = campaignsData.results.reduce((acc: number, campaign: any) => {
            const budget = campaign.campaignBudget?.amountMicros ? campaign.campaignBudget.amountMicros / 1e6 : 0;
            console.log(`Campanha: ${campaign.campaign?.name}, ID: ${campaign.campaign?.id}, Status: ${campaign.campaign?.status}, Orçamento: ${budget}`);
            return acc + budget;
          }, 0);
          
          console.log(`Orçamento diário total: ${currentDailyBudget.toFixed(2)}`);
        } else {
          console.log("Nenhuma campanha ativa encontrada");
        }
      } else {
        const errorText = await campaignsResponse.text();
        console.error("Erro ao obter orçamentos das campanhas:", errorText);
        throw new Error(`Erro ao obter orçamentos das campanhas: ${campaignsResponse.statusText}`);
      }
      
    } catch (apiError: any) {
      console.error("Erro ao acessar API do Google Ads:", apiError);
      
      // Em caso de erro na API, retornar erro sem usar valores simulados
      return { 
        success: false, 
        error: `Erro ao obter dados do Google Ads: ${apiError.message}`,
        errorDetails: apiError
      };
    }
    
    if (!hasData) {
      console.warn("Nenhum dado foi retornado pela API. Sem informações para processar.");
    }
    
    // Calcular orçamento diário ideal baseado em dados reais
    const currentDate = new Date();
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;
    
    // Calcular orçamento diário ideal
    const remainingBudget = Math.max(budgetAmount - totalSpent, 0);
    const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;

    // Configurar informações de orçamento personalizado
    const customBudgetInfo = customBudget ? {
      using_custom_budget: true,
      custom_budget_id: customBudget.id,
      custom_budget_amount: customBudget.budget_amount,
      custom_budget_start_date: customBudget.start_date,
      custom_budget_end_date: customBudget.end_date
    } : {
      using_custom_budget: false,
      custom_budget_id: null,
      custom_budget_amount: null,
      custom_budget_start_date: null,
      custom_budget_end_date: null
    };

    // Dados para a revisão
    const reviewData = {
      client_id: clientId,
      review_date: reviewDate,
      google_daily_budget_current: currentDailyBudget,
      google_total_spent: totalSpent,
      google_last_five_days_spent: lastFiveDaysSpent,
      google_account_id: accountId,
      google_account_name: accountName,
      account_display_name: accountName,
      has_real_data: hasData,  // Novo campo para indicar dados reais vs. indisponíveis
      ...customBudgetInfo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Dados calculados para revisão:", {
      orçamentoMensal: budgetAmount,
      orçamentoDiárioAtual: currentDailyBudget,
      gastoTotal: totalSpent,
      gastoMédiaCincoDias: lastFiveDaysSpent,
      orçamentoRestante: remainingBudget,
      diasRestantes: remainingDays,
      orçamentoDiárioIdeal: roundedIdealDailyBudget,
      usandoOrçamentoPersonalizado: customBudget ? true : false,
      dadosReais: hasData
    });
    
    // Atualizar ou criar revisão
    if (existingReviews && existingReviews.length > 0) {
      reviewId = existingReviews[0].id;
      
      // Atualizar revisão existente
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/google_ads_reviews?id=eq.${reviewId}`, {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          google_daily_budget_current: currentDailyBudget,
          google_total_spent: totalSpent,
          google_last_five_days_spent: lastFiveDaysSpent,
          has_real_data: hasData,
          ...customBudgetInfo,
          updated_at: new Date().toISOString()
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Erro ao atualizar revisão: ${updateResponse.statusText}`);
      }
      
      console.log(`Revisão existente atualizada: ${reviewId}`);
    } else {
      // Criar nova revisão
      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/google_ads_reviews`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(reviewData)
      });
      
      if (!insertResponse.ok) {
        throw new Error(`Erro ao criar revisão: ${insertResponse.statusText}`);
      }
      
      const newReview = await insertResponse.json();
      reviewId = newReview[0].id;
      
      console.log(`Nova revisão criada: ${reviewId}`);
    }

    return {
      success: true,
      reviewId,
      clientId,
      accountId,
      accountName,
      idealDailyBudget: roundedIdealDailyBudget,
      currentDailyBudget,
      totalSpent,
      lastFiveDaysSpent,
      has_real_data: hasData,
      ...customBudgetInfo
    };
  } catch (error) {
    console.error("Erro na função Edge do Google Ads:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handler principal da função
serve(async (req: Request) => {
  // Tratar CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const result = await processGoogleReview(req);
    
    if (!result.success) {
      return formatErrorResponse(result.error || "Erro desconhecido", 500);
    }

    return formatResponse(result);
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    return formatErrorResponse(error.message, 500);
  }
});
