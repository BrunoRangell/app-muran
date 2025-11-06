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

// Função para buscar o nome real da conta Google Ads
async function fetchRealAccountName(
  googleAccountId: string,
  headers: Record<string, string>
): Promise<string | null> {
  try {
    console.log(`🏷️ Buscando nome real da conta Google Ads: ${googleAccountId}`);
    
    const query = `
      SELECT
          customer_client.descriptive_name
      FROM
          customer_client
      WHERE
          customer_client.id = ${googleAccountId}
    `;
    
    const response = await fetch(
      `https://googleads.googleapis.com/v21/customers/${googleAccountId}/googleAds:search`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao buscar nome da conta ${googleAccountId}:`, errorText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !data.results || data.results.length === 0) {
      console.log(`📋 Nenhum nome encontrado para a conta ${googleAccountId}`);
      return null;
    }
    
    const accountName = data.results[0]?.customerClient?.descriptiveName;
    
    if (accountName) {
      console.log(`✅ Nome real da conta obtido: "${accountName}"`);
      return accountName;
    }
    
    return null;
    
  } catch (error) {
    console.error(`❌ Erro ao buscar nome da conta ${googleAccountId}:`, error);
    return null;
  }
}

// Função para atualizar o nome da conta no banco de dados
async function updateAccountName(
  supabaseUrl: string,
  supabaseKey: string,
  accountIdUuid: string,
  realAccountName: string
): Promise<boolean> {
  try {
    console.log(`💾 Atualizando nome da conta no banco: "${realAccountName}"`);
    
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/client_accounts?id=eq.${accountIdUuid}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        account_name: realAccountName,
        updated_at: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("❌ Erro ao atualizar nome da conta:", errorText);
      return false;
    }
    
    console.log(`✅ Nome da conta atualizado com sucesso: "${realAccountName}"`);
    return true;
    
  } catch (error) {
    console.error("❌ Erro ao atualizar nome da conta:", error);
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
      `https://googleads.googleapis.com/v21/customers/${googleAccountId}/googleAds:search`,
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

// Função auxiliar para registrar log de conclusão em lote
async function logBatchCompletion(
  supabaseUrl: string,
  supabaseKey: string,
  successCount: number,
  errorCount: number,
  totalClients: number,
  source: string
) {
  try {
    console.log("📝 Registrando log consolidado de conclusão em lote...");
    
    await fetch(`${supabaseUrl}/rest/v1/system_logs`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        event_type: 'batch_review_completed',
        message: `Revisão em massa Google Ads concluída ${source === 'automatic' ? 'automaticamente' : 'manualmente'}`,
        details: {
          platform: 'google',
          successCount,
          errorCount,
          totalClients,
          completedAt: new Date().toISOString(),
          source
        }
      })
    });
    
    console.log("✅ Log consolidado registrado com sucesso");
  } catch (error: any) {
    console.warn("⚠️ Erro ao registrar log consolidado:", error.message);
  }
}

// Função para processar uma revisão individual de Google Ads
async function processIndividualGoogleReview(
  clientId: string,
  supabaseUrl: string,
  supabaseKey: string,
  reviewDate: string,
  source: string
) {
  try {
    console.log(`\n🔍 [${clientId}] Iniciando processamento individual...`);
    
    // Buscar dados do cliente
    const clientResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}&select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!clientResponse.ok) {
      throw new Error(`Erro ao buscar cliente: ${clientResponse.status}`);
    }

    const clients = await clientResponse.json();
    if (!clients || clients.length === 0) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }

    const clientData = clients[0];
    
    // Buscar conta Google Ads do cliente
    const accountResponse = await fetch(
      `${supabaseUrl}/rest/v1/client_accounts?client_id=eq.${clientId}&platform=eq.google&status=eq.active&order=is_primary.desc,created_at.asc&select=*`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!accountResponse.ok) {
      throw new Error(`Erro ao buscar conta Google Ads: ${accountResponse.status}`);
    }
    
    const accounts = await accountResponse.json();
    if (!accounts || accounts.length === 0) {
      throw new Error(`Nenhuma conta Google Ads encontrada para o cliente ${clientId}`);
    }
    
    const account = accounts[0];
    const googleAccountId = account.account_id;
    const accountIdUuid = account.id;
    let accountName = account.account_name || "Conta não identificada";

    // Validar formato do ID da conta Google Ads
    if (!validateGoogleAccountId(googleAccountId)) {
      throw new Error(`Formato inválido do ID da conta Google Ads: ${googleAccountId}`);
    }

    // Verificar orçamento personalizado
    const customBudgetResponse = await fetch(
      `${supabaseUrl}/rest/v1/custom_budgets?client_id=eq.${clientId}&is_active=eq.true&platform=eq.google&start_date=lte.${reviewDate}&end_date=gte.${reviewDate}&order=created_at.desc&limit=1`, {
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
        console.log(`✅ [${clientId}] Usando orçamento personalizado (ID: ${customBudget.id})`);
      }
    }

    // 🧹 LIMPEZA AUTOMÁTICA: Remover revisões antigas da tabela budget_reviews
    console.log(`🧹 [CLEANUP] Iniciando limpeza automática da tabela budget_reviews...`);
    
    // 1. Remover TODAS as revisões anteriores a hoje
    const deleteOldResponse = await fetch(
      `${supabaseUrl}/rest/v1/budget_reviews?platform=eq.google&review_date=lt.${reviewDate}`, {
      method: "DELETE",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!deleteOldResponse.ok) {
      console.error('❌ [CLEANUP] Erro ao limpar revisões de dias anteriores');
    } else {
      console.log(`✅ [CLEANUP] Revisões de dias anteriores removidas (review_date < ${reviewDate})`);
    }

    // 2. Remover revisões duplicadas de hoje para esta conta específica
    const deleteTodayResponse = await fetch(
      `${supabaseUrl}/rest/v1/budget_reviews?platform=eq.google&client_id=eq.${clientId}&account_id=eq.${accountIdUuid}&review_date=eq.${reviewDate}`, {
      method: "DELETE",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!deleteTodayResponse.ok) {
      console.error('❌ [CLEANUP] Erro ao limpar revisões duplicadas de hoje');
    } else {
      console.log(`✅ [CLEANUP] Revisões duplicadas de hoje removidas para conta ${accountIdUuid}`);
    }

    console.log(`✅ [CLEANUP] Limpeza automática concluída`);

    // CORREÇÃO: Verificar revisão existente na tabela budget_reviews unificada (após limpeza)
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
    let realAccountName = accountName; // Usar nome atual como padrão (agora "Conta não identificada")
    
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
      
      // IMPLEMENTAÇÃO: Buscar nome real da conta Google Ads
      console.log("🏷️ Buscando nome real da conta Google Ads...");
      const fetchedAccountName = await fetchRealAccountName(googleAccountId, headers);
      
      if (fetchedAccountName && fetchedAccountName !== accountName) {
        realAccountName = fetchedAccountName;
        
        // Atualizar nome da conta no banco de dados se necessário
        if (accountIdUuid) {
          const updateSuccess = await updateAccountName(supabaseUrl, supabaseKey, accountIdUuid, realAccountName);
          if (updateSuccess) {
            console.log(`✅ Nome da conta atualizado no banco: "${realAccountName}"`);
          }
        }
      } else if (!fetchedAccountName) {
        // NOVO: Se não conseguir buscar o nome, manter "Conta não identificada"
        console.log("⚠️ Não foi possível obter o nome real da conta - usando fallback");
        realAccountName = "Conta não identificada";
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
        `https://googleads.googleapis.com/v21/customers/${googleAccountId}/googleAds:search`,
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
        `https://googleads.googleapis.com/v21/customers/${googleAccountId}/googleAds:search`,
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
      
      // IMPORTANTE: Se houve erro na API, manter "Conta não identificada"
      realAccountName = "Conta não identificada";
      
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

    // Log individual (opcional - apenas para rastreabilidade)
    console.log(`✅ [${clientId}] Revisão processada com sucesso (reviewId: ${reviewId})`);

    return {
      success: true,
      reviewId,
      clientId,
      accountId: googleAccountId,
      accountName: realAccountName,
      currentDailyBudget,
      totalSpent,
      lastFiveDaysSpent,
      companyName: clientData.company_name
    };
  } catch (error: any) {
    console.error(`❌ [${clientId}] Erro ao processar revisão:`, error.message);
    throw error;
  }
}

// Função para processar as revisões do Google Ads (individual ou em lote)
async function processGoogleReview(req: Request) {
  try {
    const requestBody = await req.text();
    console.log("📥 Corpo da requisição recebida");
    
    if (!requestBody || requestBody.trim() === '') {
      return { success: false, error: "Corpo da requisição vazio ou inválido" };
    }

    let requestData;
    try {
      requestData = JSON.parse(requestBody);
    } catch (parseError) {
      return { success: false, error: "Formato JSON inválido no corpo da requisição" };
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: "Configuração do Supabase incompleta" };
    }

    const reviewDate = requestData.reviewDate || new Date().toISOString().split("T")[0];
    const source = requestData.source || 'manual';

    // MODO LOTE: Processar múltiplos clientes
    if (Array.isArray(requestData.clientIds) && requestData.clientIds.length > 0) {
      console.log(`\n🚀 [LOTE] Iniciando processamento em lote de ${requestData.clientIds.length} clientes`);
      
      const results = await Promise.allSettled(
        requestData.clientIds.map((clientId: string) =>
          processIndividualGoogleReview(clientId, supabaseUrl, supabaseKey, reviewDate, source)
        )
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;
      
      console.log(`\n📊 [LOTE] Resultado: ${successCount} sucessos, ${errorCount} falhas`);
      
      // Registrar log consolidado
      await logBatchCompletion(supabaseUrl, supabaseKey, successCount, errorCount, requestData.clientIds.length, source);
      
      return {
        success: true,
        mode: 'batch',
        totalClients: requestData.clientIds.length,
        successCount,
        errorCount,
        results: results.map((result, index) => ({
          clientId: requestData.clientIds[index],
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason?.message : null
        }))
      };
    }

    // MODO INDIVIDUAL: Processar cliente único (manter compatibilidade)
    const { clientId, googleAccountId } = requestData;

    if (!clientId || !googleAccountId) {
      return { success: false, error: "clientId e googleAccountId são obrigatórios" };
    }

    console.log(`\n🔍 [INDIVIDUAL] Processando cliente único: ${clientId}`);
    
    const result = await processIndividualGoogleReview(clientId, supabaseUrl, supabaseKey, reviewDate, source);
    
    // Registrar log individual
    await logBatchCompletion(supabaseUrl, supabaseKey, 1, 0, 1, source);
    
    return {
      success: true,
      mode: 'individual',
      ...result
    };

  } catch (error: any) {
    console.error("❌ Erro crítico na função processGoogleReview:", error.message);
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
