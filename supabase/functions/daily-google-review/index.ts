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
      
      // Calcular datas para query
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Query para obter gastos do mês atual com informações por dia
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
      
      console.log(`📊 Consultando API do Google Ads para a conta ${googleAccountId}, período: ${startDate} a ${endDate}`);
      
      // Fazer chamada para a API do Google Ads
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
        console.error("❌ Erro detalhado da API do Google Ads:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        apiErrorDetails = {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          accountId: googleAccountId
        };
        
        throw new Error(`Erro na API do Google Ads para conta ${googleAccountId}: ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log("✅ Resposta da API do Google Ads obtida com sucesso");
      
      // Variáveis para rastrear gastos por dia
      let dailySpends: Record<string, number> = {};
      
      // NOVO: Preparar datas dos últimos 5 dias para mapear corretamente
      const lastFiveDays: string[] = [];
      for (let i = 5; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        lastFiveDays.push(date.toISOString().split('T')[0]);
      }
      
      console.log("📅 Últimos 5 dias para mapeamento:", lastFiveDays);
      
      // Calcular o gasto total e rastrear gastos por dia APENAS COM DADOS REAIS
      if (data && data.results && data.results.length > 0) {
        console.log(`📈 Encontrados ${data.results.length} resultados de gastos para a conta ${googleAccountId}`);
        
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
        
        console.log(`💰 Gasto total REAL para o mês atual: ${totalSpent.toFixed(2)}`);
        
        // NOVO: Mapear gastos individuais dos últimos 5 dias
        googleDay1Spent = dailySpends[lastFiveDays[0]] || 0; // 5 dias atrás
        googleDay2Spent = dailySpends[lastFiveDays[1]] || 0; // 4 dias atrás
        googleDay3Spent = dailySpends[lastFiveDays[2]] || 0; // 3 dias atrás
        googleDay4Spent = dailySpends[lastFiveDays[3]] || 0; // 2 dias atrás
        googleDay5Spent = dailySpends[lastFiveDays[4]] || 0; // 1 dia atrás
        
        console.log("💰 Gastos individuais dos últimos 5 dias:", {
          day1: googleDay1Spent,
          day2: googleDay2Spent,
          day3: googleDay3Spent,
          day4: googleDay4Spent,
          day5: googleDay5Spent
        });
        
      } else {
        console.log("📊 Nenhum resultado de gasto encontrado - mantendo valores zerados");
      }
      
      // IMPLEMENTAÇÃO DA MÉDIA PONDERADA
      console.log("🧮 Calculando média ponderada dos últimos 5 dias...");
      
      // Aplicar a fórmula: (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3)
      lastFiveDaysSpent = (googleDay1Spent * 0.1) + (googleDay2Spent * 0.15) + (googleDay3Spent * 0.2) + (googleDay4Spent * 0.25) + (googleDay5Spent * 0.3);
      
      console.log(`📊 Média ponderada CALCULADA: ${lastFiveDaysSpent.toFixed(2)}`, {
        formula: `(${googleDay1Spent} * 0.1) + (${googleDay2Spent} * 0.15) + (${googleDay3Spent} * 0.2) + (${googleDay4Spent} * 0.25) + (${googleDay5Spent} * 0.3)`,
        resultado: lastFiveDaysSpent
      });
      
      // Query para obter orçamentos das campanhas ativas APENAS DADOS REAIS
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
        currentDailyBudget = 0; // Manter zerado se não conseguir dados reais
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
      last_five_days_spent: lastFiveDaysSpent, // AGORA É A MÉDIA PONDERADA
      // NOVOS CAMPOS: Gastos individuais dos últimos 5 dias
      day_1_spent: googleDay1Spent,
      day_2_spent: googleDay2Spent,
      day_3_spent: googleDay3Spent,
      day_4_spent: googleDay4Spent,
      day_5_spent: googleDay5Spent,
      ...customBudgetInfo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("📋 Dados FINAIS para revisão (com média ponderada):", {
      orçamentoDiárioAtual: currentDailyBudget,
      gastoTotal: totalSpent,
      médiaPonderada: lastFiveDaysSpent, // AGORA É A MÉDIA PONDERADA
      gastosIndividuais: {
        dia1: googleDay1Spent,
        dia2: googleDay2Spent,
        dia3: googleDay3Spent,
        dia4: googleDay4Spent,
        dia5: googleDay5Spent
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
            last_five_days_spent: lastFiveDaysSpent, // MÉDIA PONDERADA
            // NOVOS CAMPOS: Gastos individuais
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
          
          // Se for erro de chave estrangeira com orçamento personalizado, tentar sem ele
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
                last_five_days_spent: lastFiveDaysSpent, // MÉDIA PONDERADA
                // NOVOS CAMPOS: Gastos individuais
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
            
            console.log(`✅ Revisão existente atualizada com média ponderada (sem orçamento personalizado): ${reviewId}`);
          } else {
            throw new Error(`Erro ao atualizar revisão: ${updateResponse.status} - ${errorText}`);
          }
        } else {
          console.log(`✅ Revisão existente atualizada com média ponderada: ${reviewId}`);
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
          
          // Se for erro de chave estrangeira com orçamento personalizado, tentar sem ele
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
            
            console.log(`✅ Nova revisão criada com média ponderada (sem orçamento personalizado): ${reviewId}`);
          } else {
            throw new Error(`Erro ao criar revisão: ${insertResponse.status} - ${errorText}`);
          }
        } else {
          const newReview = await insertResponse.json();
          reviewId = newReview[0].id;
          
          console.log(`✅ Nova revisão criada com média ponderada: ${reviewId}`);
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
      lastFiveDaysSpent, // AGORA É A MÉDIA PONDERADA
      // NOVOS DADOS RETORNADOS: Gastos individuais
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
