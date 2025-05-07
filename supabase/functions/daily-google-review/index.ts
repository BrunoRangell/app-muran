
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
    
    // Simular valores de orçamento e gastos para demonstração
    // Em produção, estes valores viriam da API do Google Ads
    const totalSpent = budgetAmount * 0.62; // 62% do orçamento gasto (simulação)
    const currentDate = new Date();
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;
    const remainingBudget = Math.max(budgetAmount - totalSpent, 0);
    const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;

    // Dados para a revisão
    const reviewData = {
      client_id: clientId,
      review_date: reviewDate,
      google_daily_budget_current: roundedIdealDailyBudget,
      google_total_spent: totalSpent,
      google_account_id: accountId,
      google_account_name: accountName,
      account_display_name: accountName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
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
          google_daily_budget_current: roundedIdealDailyBudget,
          google_total_spent: totalSpent,
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
      totalSpent
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
