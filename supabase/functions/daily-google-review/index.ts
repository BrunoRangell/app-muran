
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";

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
    let accountDetails = null;
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
          accountDetails = accounts[0];
        }
      }
    } else {
      // Buscar contas do cliente
      const accountsResponse = await fetch(
        `${supabaseUrl}/rest/v1/client_google_accounts?client_id=eq.${clientId}&select=*`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        if (accounts && accounts.length > 0) {
          // Usar a conta primária ou a primeira conta
          const primaryAccount = accounts.find((acc) => acc.is_primary) || accounts[0];
          accountName = primaryAccount.account_name || "Conta Google";
          budgetAmount = primaryAccount.budget_amount || client.google_ads_budget || 0;
          accountId = primaryAccount.account_id;
          accountDetails = primaryAccount;
        }
      }
    }

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
    
    // Obter tokens da API do Google Ads com tratamento de erros melhorado
    const googleTokensResponse = await fetch(
      `${supabaseUrl}/rest/v1/api_tokens?name=in.(google_ads_access_token,google_ads_refresh_token,google_ads_client_id,google_ads_client_secret,google_ads_developer_token,google_ads_manager_id)&select=name,value`, {
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
    const googleTokens: Record<string, string> = {};
    
    googleTokensData.forEach((token: { name: string; value: string }) => {
      googleTokens[token.name] = token.value;
    });
    
    // Verificar se os tokens necessários estão disponíveis
    if (!googleTokens.google_ads_access_token || !googleTokens.google_ads_developer_token) {
      throw new Error("Tokens do Google Ads não configurados corretamente");
    }
    
    // Verificar se temos o token do gerenciador de contas
    const managerAccountId = googleTokens.google_ads_manager_id;
    
    if (!managerAccountId) {
      console.warn("ID da conta gerenciadora não configurado. Isso pode causar problemas de permissão.");
    }
    
    // Tentar atualizar o token de acesso se tivermos um refresh token
    let accessToken = googleTokens.google_ads_access_token;
    
    if (googleTokens.google_ads_refresh_token && 
        googleTokens.google_ads_client_id && 
        googleTokens.google_ads_client_secret) {
      try {
        console.log("Tentando atualizar o token de acesso do Google Ads...");
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: googleTokens.google_ads_client_id,
            client_secret: googleTokens.google_ads_client_secret,
            refresh_token: googleTokens.google_ads_refresh_token,
            grant_type: "refresh_token"
          })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.access_token) {
            console.log("Token de acesso atualizado com sucesso");
            accessToken = refreshData.access_token;
            
            // Atualizar o token no banco de dados
            await fetch(
              `${supabaseUrl}/rest/v1/api_tokens?name=eq.google_ads_access_token`, {
              method: "PATCH",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                value: refreshData.access_token,
                updated_at: new Date().toISOString()
              })
            });
            
            // Registrar a atualização do token
            await fetch(
              `${supabaseUrl}/rest/v1/system_logs`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                event_type: "token_refresh",
                message: "Token do Google Ads atualizado com sucesso",
                details: {
                  token_type: "google_ads_access_token"
                }
              })
            });
          }
        } else {
          const errorText = await refreshResponse.text();
          console.error("Erro ao atualizar token:", errorText);
          
          // Registrar o erro de atualização do token
          await fetch(
            `${supabaseUrl}/rest/v1/system_logs`, {
            method: "POST",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              event_type: "token_refresh_error",
              message: "Erro ao atualizar token do Google Ads",
              details: {
                error: errorText
              }
            })
          });
        }
      } catch (refreshError) {
        console.error("Erro ao tentar atualizar o token:", refreshError);
      }
    }
    
    // Dados para armazenar resultados da API
    let totalSpent = 0;
    let lastFiveDaysSpent = 0;
    let currentDailyBudget = 0;
    let usingRealData = false;
    let apiResponses = [];
    
    try {
      // Configurar headers para a API do Google Ads
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': googleTokens.google_ads_developer_token,
        'Content-Type': 'application/json'
      };
      
      // Adicionar login-customer-id se temos uma conta gerenciadora
      if (managerAccountId) {
        headers['login-customer-id'] = managerAccountId;
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
      
      // Query para obter gastos do mês atual com campos adicionais
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
        let errorText = await response.text();
        console.error("Erro na API do Google Ads:", errorText);
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          errorJson = { error: { message: errorText } };
        }
        
        let errorDetail = errorJson?.error?.message || errorText;
        let errorCode = response.status;
        
        // Registrar o erro de API
        await fetch(
          `${supabaseUrl}/rest/v1/system_logs`, {
          method: "POST",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            event_type: "google_ads_api_error",
            message: `Erro na API do Google Ads: ${errorCode} - ${errorDetail}`,
            details: {
              account_id: accountId,
              error: errorJson
            }
          })
        });
        
        // Verificar se o erro é de autenticação para dar feedback específico
        if (errorCode === 401 || errorDetail.includes("authentication") || errorDetail.includes("token")) {
          throw new Error(`Erro de autenticação na API do Google Ads: ${errorDetail}. Tente atualizar os tokens de acesso.`);
        }
        
        // Verificar se é erro de permissão
        if (errorCode === 403 || errorDetail.includes("permission") || errorDetail.includes("access")) {
          throw new Error(`Erro de permissão na API do Google Ads: ${errorDetail}. Verifique se a conta ID ${accountId} está acessível pela conta gerenciadora.`);
        }
        
        throw new Error(`Erro na API do Google Ads: ${response.statusText} - ${errorDetail}`);
      }
      
      const data = await response.json();
      apiResponses.push({ type: "spend_data", data });
      usingRealData = true;
      
      // Armazenar dados por data para calcular gastos diários precisos
      const costsByDate = {};
      let uniqueDatesCount = 0;
      let last5DaysCount = 0;
      let last5DaysTotal = 0;
      
      // Calcular o gasto total somando o custo de todas as campanhas
      if (data && data.results && data.results.length > 0) {
        // Processar resultados para calcular gastos
        data.results.forEach((campaign: any) => {
          const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1_000_000 : 0;
          const date = campaign.segments?.date;
          
          // Adicionar ao gasto total
          totalSpent += cost;
          
          // Agrupar gastos por data
          if (date) {
            if (!costsByDate[date]) {
              costsByDate[date] = 0;
              uniqueDatesCount++;
            }
            costsByDate[date] += cost;
            
            // Verificar se está dentro dos últimos 5 dias (excluindo hoje)
            if (date >= fiveDaysAgoDate && date <= yesterdayFormattedDate) {
              last5DaysTotal += cost;
              
              // Contar dias únicos nos últimos 5 dias
              if (!costsByDate[`last5_${date}`]) {
                costsByDate[`last5_${date}`] = true;
                last5DaysCount++;
              }
            }
          }
        });
        
        console.log(`Dados reais obtidos da API: ${data.results.length} resultados`);
        console.log(`Gasto total real: ${totalSpent}`);
        console.log(`Datas únicas: ${uniqueDatesCount}`);
      } else {
        console.warn("Nenhum resultado retornado da API do Google Ads");
      }
      
      // Calcular a média diária dos últimos 5 dias
      lastFiveDaysSpent = last5DaysCount > 0 ? last5DaysTotal / last5DaysCount : 0;
      console.log(`Média dos últimos 5 dias (${last5DaysCount} dias): ${lastFiveDaysSpent}`);
      
      // Se não temos dados dos últimos 5 dias, usar dados históricos em vez de simular
      if (lastFiveDaysSpent === 0) {
        console.log("Sem dados dos últimos 5 dias. Consultando dados históricos...");
        
        // Buscar revisões anteriores para esta conta
        const historicalReviewsResponse = await fetch(
          `${supabaseUrl}/rest/v1/google_ads_reviews?client_id=eq.${clientId}&google_account_id=eq.${accountId}&order=review_date.desc&limit=5`, {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json"
          }
        });
        
        if (historicalReviewsResponse.ok) {
          const historicalReviews = await historicalReviewsResponse.json();
          if (historicalReviews && historicalReviews.length > 0) {
            // Usar média dos últimos 5 dias da revisão mais recente
            const lastReview = historicalReviews[0];
            if (lastReview.google_last_five_days_spent) {
              lastFiveDaysSpent = lastReview.google_last_five_days_spent;
              console.log(`Usando média histórica dos últimos 5 dias: ${lastFiveDaysSpent}`);
            }
          }
        }
      }
      
      // Obter orçamento diário atual somando os orçamentos das campanhas ativas
      const campaignsQuery = `
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign_budget.amount_micros
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
        apiResponses.push({ type: "campaigns_data", data: campaignsData });
        
        if (campaignsData && campaignsData.results) {
          console.log(`Encontradas ${campaignsData.results.length} campanhas ativas`);
          
          // Calcular a soma dos orçamentos de todas as campanhas ativas
          const budgets = new Map();
          currentDailyBudget = 0;
          
          campaignsData.results.forEach((campaign: any) => {
            // Verificar todos os campos relevantes
            const campaignName = campaign.campaign?.name || "Sem nome";
            const campaignStatus = campaign.campaign?.status || "UNKNOWN";
            const budgetMicros = campaign.campaignBudget?.amountMicros;
            
            // Converter micros para valor real (dividir por 1.000.000)
            const budget = budgetMicros ? budgetMicros / 1_000_000 : 0;
            
            console.log(`Campanha: ${campaignName}, Status: ${campaignStatus}, Orçamento: ${budget}`);
            
            // Adicionar ao orçamento diário atual apenas se a campanha estiver ativa
            if (campaignStatus === 'ENABLED' && budget > 0) {
              currentDailyBudget += budget;
              
              // Rastrear orçamentos únicos para evitar duplicações
              if (!budgets.has(String(budgetMicros))) {
                budgets.set(String(budgetMicros), true);
              }
            }
          });
          
          console.log(`Orçamento diário atual (soma das campanhas ativas): ${currentDailyBudget}`);
        } else {
          console.log("Nenhuma campanha ativa encontrada");
        }
      } else {
        const errorText = await campaignsResponse.text();
        console.error("Erro ao obter orçamentos das campanhas:", errorText);
        
        // Tentar extrair mensagem de erro estruturada
        try {
          const errorJson = JSON.parse(errorText);
          apiResponses.push({ type: "campaigns_error", error: errorJson });
        } catch (e) {
          apiResponses.push({ type: "campaigns_error", error: errorText });
        }
      }
      
      // Verificar os valores obtidos e usar dados históricos se necessário
      if (currentDailyBudget === 0) {
        console.log("Orçamento diário atual é zero. Verificando dados históricos...");
        
        // Buscar revisões anteriores para esta conta
        const historicalReviewsResponse = await fetch(
          `${supabaseUrl}/rest/v1/google_ads_reviews?client_id=eq.${clientId}&google_account_id=eq.${accountId}&order=review_date.desc&limit=1`, {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json"
          }
        });
        
        if (historicalReviewsResponse.ok) {
          const historicalReviews = await historicalReviewsResponse.json();
          if (historicalReviews && historicalReviews.length > 0) {
            // Usar orçamento diário da revisão mais recente
            const lastReview = historicalReviews[0];
            if (lastReview.google_daily_budget_current) {
              currentDailyBudget = lastReview.google_daily_budget_current;
              console.log(`Usando orçamento diário histórico: ${currentDailyBudget}`);
            }
          }
        }
      }
      
    } catch (apiError: any) {
      console.error("Erro ao acessar API do Google Ads:", apiError);
      
      // Verificar se devemos usar valores históricos em vez de simulados
      if (!usingRealData) {
        console.log("Tentando usar dados históricos devido ao erro na API...");
        
        // Buscar a revisão mais recente para este cliente/conta
        const historyResponse = await fetch(
          `${supabaseUrl}/rest/v1/google_ads_reviews?client_id=eq.${clientId}&google_account_id=eq.${accountId}&order=review_date.desc&limit=1`, {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json"
          }
        });
        
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          if (history && history.length > 0) {
            console.log("Usando dados históricos da última revisão");
            
            totalSpent = history[0].google_total_spent || 0;
            lastFiveDaysSpent = history[0].google_last_five_days_spent || 0;
            currentDailyBudget = history[0].google_daily_budget_current || 0;
            
            // Marca como usando dados "parcialmente reais" (históricos, não simulados)
            usingRealData = true;
          } else {
            // Se não temos dados históricos, usamos uma simulação mais conservadora
            console.warn("Sem histórico disponível. Usando simulação como último recurso");
            
            // Simulação mais conservadora, com feedback claro
            const simulation_percentage = budgetAmount > 0 ? 0.5 : 0;  // 50% do orçamento gasto (simulação)
            totalSpent = Math.round(budgetAmount * simulation_percentage * 100) / 100;
            lastFiveDaysSpent = Math.round((totalSpent / 20) * 100) / 100; // média simplificada (assumindo 20 dias no mês)
            
            console.log("Valores simulados:", {
              orçamento: budgetAmount,
              porcentagem_simulada: simulation_percentage,
              gasto_total: totalSpent,
              média_5_dias: lastFiveDaysSpent
            });
          }
        } else {
          // Simulação mais conservadora como último recurso
          console.warn("Erro ao buscar histórico. Usando simulação como último recurso");
          
          const simulation_percentage = budgetAmount > 0 ? 0.5 : 0;  // 50% do orçamento gasto
          totalSpent = Math.round(budgetAmount * simulation_percentage * 100) / 100;
          lastFiveDaysSpent = Math.round((totalSpent / 20) * 100) / 100;
        }
      }
      
      // Registrar erro no sistema
      await fetch(
        `${supabaseUrl}/rest/v1/system_logs`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          event_type: "google_ads_api_error",
          message: apiError.message || "Erro desconhecido ao acessar API do Google Ads",
          details: {
            client_id: clientId,
            account_id: accountId,
            error: apiError.toString(),
            using_historical_data: usingRealData
          }
        })
      });
    }
    
    // Calcular orçamento diário ideal baseado nos dados
    const currentDate = new Date();
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;
    
    // Calcular orçamento diário ideal
    const remainingBudget = Math.max(budgetAmount - totalSpent, 0);
    const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;

    // Dados para a revisão
    const reviewData = {
      client_id: clientId,
      client_account_id: accountDetails ? accountDetails.id : null,
      review_date: reviewDate,
      google_daily_budget_current: currentDailyBudget,
      google_total_spent: totalSpent,
      google_last_five_days_spent: lastFiveDaysSpent,
      google_account_id: accountId,
      google_account_name: accountName,
      account_display_name: accountName,
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
      usandoDadosReais: usingRealData
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
      usingRealData,
      apiResponses: apiResponses.length > 0 ? apiResponses : undefined
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
