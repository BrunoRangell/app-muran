
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";

// Função para validar ID da conta do Google Ads
function validateGoogleAccountId(accountId: string): boolean {
  // ID deve ser numérico e ter entre 8-12 dígitos
  const accountIdRegex = /^\d{8,12}$/;
  return accountIdRegex.test(accountId);
}

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

// Função para validar se um orçamento personalizado existe
async function validateCustomBudget(supabaseUrl: string, supabaseKey: string, budgetId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/custom_budgets?id=eq.${budgetId}&platform=eq.google&select=id`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      console.error(`Erro ao validar orçamento personalizado: ${response.statusText}`);
      return false;
    }
    
    const budgets = await response.json();
    return budgets && budgets.length > 0;
  } catch (error) {
    console.error("Erro ao validar orçamento personalizado:", error);
    return false;
  }
}

// Função para buscar gastos de um dia específico
async function fetchDailySpend(
  googleAccountId: string,
  targetDate: string,
  headers: Record<string, string>
): Promise<number> {
  try {
    console.log(`🔍 Buscando gastos para ${targetDate} da conta ${googleAccountId}`);
    
    const query = `
      SELECT
          metrics.cost_micros,
          campaign.id,
          campaign.name
      FROM
          campaign
      WHERE
          segments.date BETWEEN '${targetDate}' AND '${targetDate}'
    `;
    
    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${googleAccountId}/googleAds:search`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na API do Google Ads para ${targetDate}:`, errorText);
      return 0; // Retornar 0 em caso de erro
    }
    
    const data = await response.json();
    
    if (!data || !data.results || data.results.length === 0) {
      console.log(`📊 Nenhum gasto encontrado para ${targetDate}`);
      return 0;
    }
    
    const totalSpend = data.results.reduce((acc: number, campaign: any) => {
      const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
      return acc + cost;
    }, 0);
    
    console.log(`💰 Gasto total para ${targetDate}: ${totalSpend.toFixed(2)}`);
    return totalSpend;
    
  } catch (error) {
    console.error(`❌ Erro ao buscar gastos para ${targetDate}:`, error);
    return 0;
  }
}

// Função para processar as revisões do Google Ads
async function processGoogleReview(req: Request) {
  try {
    const requestBody = await req.text();
    console.log("Corpo da requisição recebida:", requestBody);
    
    if (!requestBody || requestBody.trim() === '') {
      console.error("Corpo da requisição vazio");
      return { success: false, error: "Corpo da requisição vazio ou inválido" };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", parseError);
      return { success: false, error: "Formato JSON inválido no corpo da requisição" };
    }

    const { clientId, googleAccountId, reviewDate = new Date().toISOString().split("T")[0] } = parsedBody;

    console.log("Parâmetros extraídos:", { clientId, googleAccountId, reviewDate });

    if (!clientId) {
      console.error("ID do cliente não fornecido");
      return { success: false, error: "ID do cliente é obrigatório" };
    }

    if (!googleAccountId) {
      console.error("ID da conta Google Ads não fornecido");
      return { success: false, error: "ID da conta Google Ads é obrigatório" };
    }

    // Validar formato do ID da conta Google Ads
    if (!validateGoogleAccountId(googleAccountId)) {
      console.error("Formato inválido do ID da conta Google Ads:", googleAccountId);
      return { 
        success: false, 
        error: `Formato inválido do ID da conta Google Ads: ${googleAccountId}. Deve conter apenas números e ter entre 8-12 dígitos.` 
      };
    }

    console.log(`Processando revisão do Google Ads para cliente ${clientId}, conta ${googleAccountId} na data ${reviewDate}`);
    
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
      const errorText = await clientResponse.text();
      console.error("Erro ao buscar cliente:", errorText);
      throw new Error(`Erro ao buscar cliente: ${clientResponse.status} - ${errorText}`);
    }

    const clients = await clientResponse.json();
    if (!clients || clients.length === 0) {
      return { success: false, error: `Cliente ${clientId} não encontrado` };
    }

    const client = clients[0];
    
    // Buscar ou criar conta do Google Ads específica
    let accountName = "Conta Principal";
    let accountIdUuid = null;
    
    const accountResponse = await fetch(
      `${supabaseUrl}/rest/v1/client_accounts?client_id=eq.${clientId}&account_id=eq.${googleAccountId}&platform=eq.google&select=*`, {
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
        accountIdUuid = accounts[0].id;
      } else {
        // Criar nova conta se não existir
        const createAccountResponse = await fetch(
          `${supabaseUrl}/rest/v1/client_accounts`, {
          method: "POST",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            client_id: clientId,
            platform: "google",
            account_id: googleAccountId,
            account_name: accountName,
            budget_amount: 0,
            status: "active"
          })
        });
        
        if (createAccountResponse.ok) {
          const newAccount = await createAccountResponse.json();
          accountIdUuid = newAccount[0].id;
          console.log(`✅ Nova conta Google Ads criada: ${accountIdUuid}`);
        }
      }
    }

    // Verificar orçamento personalizado
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
    
    if (customBudgetResponse.ok) {
      const customBudgets = await customBudgetResponse.json();
      if (customBudgets && customBudgets.length > 0) {
        customBudget = customBudgets[0];
        console.log(`✅ Usando orçamento personalizado (ID: ${customBudget.id})`);
      }
    }

    // CORREÇÃO: Verificar revisão existente na tabela budget_reviews unificada
    const existingReviewResponse = await fetch(
      `${supabaseUrl}/rest/v1/budget_reviews?client_id=eq.${clientId}&account_id=eq.${accountIdUuid}&platform=eq.google&review_date=eq.${reviewDate}&select=id`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });
    
    const existingReviews = await existingReviewResponse.json();
    let reviewId;
    
    // VALORES PADRÃO: SEMPRE ZERADOS SE NÃO CONSEGUIRMOS DADOS REAIS
    let totalSpent = 0;
    let lastFiveDaysSpent = 0;
    let currentDailyBudget = 0;
    let apiErrorDetails = null;
    
    // NOVOS CAMPOS: Gastos individuais dos últimos 5 dias
    let googleDay1Spent = 0;
    let googleDay2Spent = 0;
    let googleDay3Spent = 0;
    let googleDay4Spent = 0;
    let googleDay5Spent = 0;
    
    try {
      console.log("🔍 Tentando obter dados reais da API do Google Ads...");
      
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
      
      // Configurar headers para a API do Google Ads
      const headers = {
        'Authorization': `Bearer ${googleTokens.google_ads_access_token}`,
        'developer-token': googleTokens.google_ads_developer_token,
        'Content-Type': 'application/json'
      };
      
      if (googleTokens.google_ads_manager_id) {
        headers['login-customer-id'] = googleTokens.google_ads_manager_id;
      }
      
      // NOVA IMPLEMENTAÇÃO: Calcular as datas dos últimos 5 dias e buscar gastos individuais
      const currentDate = new Date();
      const lastFiveDays: string[] = [];
      
      for (let i = 1; i <= 5; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        lastFiveDays.push(date.toISOString().split('T')[0]);
      }
      
      console.log("📅 Datas dos últimos 5 dias:", lastFiveDays);
      
      // Fazer 5 queries separadas para cada dia
      const [day1Spend, day2Spend, day3Spend, day4Spend, day5Spend] = await Promise.all([
        fetchDailySpend(googleAccountId, lastFiveDays[0], headers), // ontem
        fetchDailySpend(googleAccountId, lastFiveDays[1], headers), // anteontem
        fetchDailySpend(googleAccountId, lastFiveDays[2], headers), // 3 dias atrás
        fetchDailySpend(googleAccountId, lastFiveDays[3], headers), // 4 dias atrás
        fetchDailySpend(googleAccountId, lastFiveDays[4], headers), // 5 dias atrás
      ]);
      
      // Mapear corretamente os gastos individuais
      googleDay5Spent = day1Spend; // day_5_spent = ontem (mais recente, peso 0.3)
      googleDay4Spent = day2Spend; // day_4_spent = anteontem (peso 0.25)
      googleDay3Spent = day3Spend; // day_3_spent = 3 dias atrás (peso 0.2)
      googleDay2Spent = day4Spend; // day_2_spent = 4 dias atrás (peso 0.15)
      googleDay1Spent = day5Spend; // day_1_spent = 5 dias atrás (mais antigo, peso 0.1)
      
      console.log("💰 Gastos individuais corrigidos dos últimos 5 dias:", {
        day1Spent_5diasAtras: googleDay1Spent,
        day2Spent_4diasAtras: googleDay2Spent,
        day3Spent_3diasAtras: googleDay3Spent,
        day4Spent_anteontem: googleDay4Spent,
        day5Spent_ontem: googleDay5Spent
      });
      
      // IMPLEMENTAÇÃO DA MÉDIA PONDERADA CORRIGIDA
      console.log("🧮 Calculando média ponderada dos últimos 5 dias...");
      
      // Aplicar a fórmula: (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3)
      lastFiveDaysSpent = (googleDay1Spent * 0.1) + (googleDay2Spent * 0.15) + (googleDay3Spent * 0.2) + (googleDay4Spent * 0.25) + (googleDay5Spent * 0.3);
      
      console.log(`📊 Média ponderada CORRIGIDA: ${lastFiveDaysSpent.toFixed(2)}`, {
        formula: `(${googleDay1Spent} * 0.1) + (${googleDay2Spent} * 0.15) + (${googleDay3Spent} * 0.2) + (${googleDay4Spent} * 0.25) + (${googleDay5Spent} * 0.3)`,
        resultado: lastFiveDaysSpent
      });
      
      // Buscar gasto total do mês atual
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = currentDate.toISOString().split('T')[0];
      
      const monthlyQuery = `
        SELECT
            metrics.cost_micros,
            campaign.id,
            campaign.name
        FROM
            campaign
        WHERE
            segments.date BETWEEN '${startDate}' AND '${endDate}'
      `;
      
      console.log(`📊 Consultando gasto total do mês para a conta ${googleAccountId}, período: ${startDate} a ${endDate}`);
      
      const monthlyResponse = await fetch(
        `https://googleads.googleapis.com/v18/customers/${googleAccountId}/googleAds:search`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ query: monthlyQuery })
        }
      );
      
      if (monthlyResponse.ok) {
        const monthlyData = await monthlyResponse.json();
        
        if (monthlyData && monthlyData.results && monthlyData.results.length > 0) {
          totalSpent = monthlyData.results.reduce((acc: number, campaign: any) => {
            const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
            return acc + cost;
          }, 0);
          
          console.log(`💰 Gasto total REAL para o mês atual: ${totalSpent.toFixed(2)}`);
        } else {
          console.log("📊 Nenhum gasto mensal encontrado - mantendo valores zerados");
          totalSpent = 0;
        }
      }
      
      // Query para obter orçamentos das campanhas ativas
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
      
      console.log(`🔍 Consultando orçamentos REAIS das campanhas ativas para a conta ${googleAccountId}`);
      
      const campaignsResponse = await fetch(
        `https://googleads.googleapis.com/v18/customers/${googleAccountId}/googleAds:search`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ query: campaignsQuery })
        }
      );
      
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        
        if (campaignsData && campaignsData.results && campaignsData.results.length > 0) {
          console.log(`📋 Encontradas ${campaignsData.results.length} campanhas ativas`);
          
          currentDailyBudget = campaignsData.results.reduce((acc: number, campaign: any) => {
            const budget = campaign.campaignBudget?.amountMicros ? campaign.campaignBudget.amountMicros / 1e6 : 0;
            return acc + budget;
          }, 0);
          
          console.log(`💰 Orçamento diário REAL total: ${currentDailyBudget.toFixed(2)}`);
        } else {
          console.log("📊 Nenhuma campanha ativa encontrada - orçamento diário mantido zerado");
          currentDailyBudget = 0;
        }
      } else {
        const errorText = await campaignsResponse.text();
        console.error("❌ Erro ao obter orçamentos das campanhas:", errorText);
        currentDailyBudget = 0;
      }
      
    } catch (apiError: any) {
      console.error("❌ Erro ao acessar API do Google Ads - usando valores zerados:", apiError);
      // Valores já estão zerados, não fazer nada
      totalSpent = 0;
      lastFiveDaysSpent = 0;
      currentDailyBudget = 0;
      
      // Manter gastos individuais zerados
      googleDay1Spent = 0;
      googleDay2Spent = 0;
      googleDay3Spent = 0;
      googleDay4Spent = 0;
      googleDay5Spent = 0;
      
      apiErrorDetails = apiErrorDetails || {
        message: apiError.message,
        accountId: googleAccountId
      };
    }
    
    // CORREÇÃO CRÍTICA: Configurar informações de orçamento personalizado com validação defensiva
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

    // CORREÇÃO: Dados para a revisão na tabela budget_reviews unificada
    const reviewData = {
      client_id: clientId,
      account_id: accountIdUuid,
      platform: 'google',
      review_date: reviewDate,
      daily_budget_current: currentDailyBudget,
      total_spent: totalSpent,
      last_five_days_spent: lastFiveDaysSpent, // MÉDIA PONDERADA CORRIGIDA
      // CAMPOS CORRIGIDOS: Gastos individuais dos últimos 5 dias
      day_1_spent: googleDay1Spent, // 5 dias atrás (mais antigo)
      day_2_spent: googleDay2Spent, // 4 dias atrás
      day_3_spent: googleDay3Spent, // 3 dias atrás
      day_4_spent: googleDay4Spent, // anteontem
      day_5_spent: googleDay5Spent, // ontem (mais recente)
      ...customBudgetInfo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("📋 Dados FINAIS para revisão (com queries individuais corrigidas):", {
      orçamentoDiárioAtual: currentDailyBudget,
      gastoTotal: totalSpent,
      médiaPonderadaCorrigida: lastFiveDaysSpent,
      gastosIndividuaisCorrigidos: {
        day1_5diasAtras: googleDay1Spent,
        day2_4diasAtras: googleDay2Spent,
        day3_3diasAtras: googleDay3Spent,
        day4_anteontem: googleDay4Spent,
        day5_ontem: googleDay5Spent
      },
      usandoOrçamentoPersonalizado: customBudget ? true : false,
      customBudgetId: customBudget?.id || null,
      apiErrorDetails
    });
    
    // CORREÇÃO: Atualizar ou criar revisão na tabela budget_reviews unificada
    try {
      if (existingReviews && existingReviews.length > 0) {
        reviewId = existingReviews[0].id;
        
        // Atualizar revisão existente
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/budget_reviews?id=eq.${reviewId}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            daily_budget_current: currentDailyBudget,
            total_spent: totalSpent,
            last_five_days_spent: lastFiveDaysSpent,
            day_1_spent: googleDay1Spent,
            day_2_spent: googleDay2Spent,
            day_3_spent: googleDay3Spent,
            day_4_spent: googleDay4Spent,
            day_5_spent: googleDay5Spent,
            ...customBudgetInfo,
            updated_at: new Date().toISOString()
          })
        });
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error("❌ Erro ao atualizar revisão:", errorText);
          
          if (errorText.includes("violates foreign key constraint") && customBudget) {
            console.warn("⚠️ Erro de chave estrangeira com orçamento personalizado - tentando sem orçamento personalizado");
            
            const fallbackUpdateResponse = await fetch(
              `${supabaseUrl}/rest/v1/budget_reviews?id=eq.${reviewId}`, {
              method: "PATCH",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                daily_budget_current: currentDailyBudget,
                total_spent: totalSpent,
                last_five_days_spent: lastFiveDaysSpent,
                day_1_spent: googleDay1Spent,
                day_2_spent: googleDay2Spent,
                day_3_spent: googleDay3Spent,
                day_4_spent: googleDay4Spent,
                day_5_spent: googleDay5Spent,
                using_custom_budget: false,
                custom_budget_id: null,
                custom_budget_amount: null,
                custom_budget_start_date: null,
                custom_budget_end_date: null,
                updated_at: new Date().toISOString()
              })
            });
            
            if (!fallbackUpdateResponse.ok) {
              const fallbackErrorText = await fallbackUpdateResponse.text();
              throw new Error(`Erro ao atualizar revisão (fallback): ${fallbackUpdateResponse.status} - ${fallbackErrorText}`);
            }
            
            console.log(`✅ Revisão existente atualizada com dados corrigidos (sem orçamento personalizado): ${reviewId}`);
          } else {
            throw new Error(`Erro ao atualizar revisão: ${updateResponse.status} - ${errorText}`);
          }
        } else {
          console.log(`✅ Revisão existente atualizada com dados corrigidos: ${reviewId}`);
        }
      } else {
        // Criar nova revisão
        const insertResponse = await fetch(
          `${supabaseUrl}/rest/v1/budget_reviews`, {
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
          const errorText = await insertResponse.text();
          console.error("❌ Erro ao criar revisão:", errorText);
          
          if (errorText.includes("violates foreign key constraint") && customBudget) {
            console.warn("⚠️ Erro de chave estrangeira com orçamento personalizado - tentando sem orçamento personalizado");
            
            const fallbackReviewData = {
              ...reviewData,
              using_custom_budget: false,
              custom_budget_id: null,
              custom_budget_amount: null,
              custom_budget_start_date: null,
              custom_budget_end_date: null
            };
            
            const fallbackInsertResponse = await fetch(
              `${supabaseUrl}/rest/v1/budget_reviews`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
              },
              body: JSON.stringify(fallbackReviewData)
            });
            
            if (!fallbackInsertResponse.ok) {
              const fallbackErrorText = await fallbackInsertResponse.text();
              throw new Error(`Erro ao criar revisão (fallback): ${fallbackInsertResponse.status} - ${fallbackErrorText}`);
            }
            
            const newReview = await fallbackInsertResponse.json();
            reviewId = newReview[0].id;
            
            console.log(`✅ Nova revisão criada com dados corrigidos (sem orçamento personalizado): ${reviewId}`);
          } else {
            throw new Error(`Erro ao criar revisão: ${insertResponse.status} - ${errorText}`);
          }
        } else {
          const newReview = await insertResponse.json();
          reviewId = newReview[0].id;
          
          console.log(`✅ Nova revisão criada com dados corrigidos: ${reviewId}`);
        }
      }
    } catch (dbError: any) {
      console.error("❌ Erro crítico ao salvar revisão:", dbError);
      throw new Error(`Erro crítico ao salvar revisão: ${dbError.message}`);
    }

    return {
      success: true,
      reviewId,
      clientId,
      accountId: googleAccountId,
      accountName,
      currentDailyBudget,
      totalSpent,
      lastFiveDaysSpent,
      individualDaysSpent: {
        day1: googleDay1Spent,
        day2: googleDay2Spent,
        day3: googleDay3Spent,
        day4: googleDay4Spent,
        day5: googleDay5Spent
      },
      apiErrorDetails,
      ...customBudgetInfo
    };
  } catch (error) {
    console.error("❌ Erro na função Edge do Google Ads:", error.message);
    return {
      success: false,
      error: error.message,
      details: error
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
      console.error("❌ Resultado com erro:", result);
      return formatErrorResponse(result.error || "Erro desconhecido", 400);
    }

    return formatResponse(result);
  } catch (error) {
    console.error("❌ Erro crítico na função Edge:", error.message);
    return formatErrorResponse(`Erro crítico: ${error.message}`, 500);
  }
});
