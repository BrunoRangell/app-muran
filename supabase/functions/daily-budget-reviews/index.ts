// This is a Supabase Edge Function that handles Meta Ads API integration
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuração de CORS para permitir acesso da aplicação web
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetaAdsRequest {
  method: string;
  clientId: string;
  reviewDate: string;
  accesstoken: string;
}

async function fetchCampaignsMeta(accountId: string, accesstoken: string) {
  let allCampaigns = [];
  let url = `https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time&access_token=${accesstoken}`;
  try {
    while (url) {
      console.log(`Buscando campanhas, URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao buscar campanhas: ${await response.text()}`);
      }
      const data = await response.json();
      allCampaigns = allCampaigns.concat(data.data);
      url = data.paging?.next || null;
    }
    console.log(`Total de campanhas recuperadas: ${allCampaigns.length}`);
    return allCampaigns;
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error.message);
    throw error;
  }
}

async function fetchAdSets(campaignId: string, accesstoken: string) {
  let allAdSets = [];
  let url = `https://graph.facebook.com/v20.0/${campaignId}/adsets?fields=daily_budget,status,name,end_time&access_token=${accesstoken}`;
  try {
    while (url) {
      console.log(`Buscando ad sets para campanha ${campaignId}, URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao buscar ad sets: ${await response.text()}`);
      }
      const data = await response.json();
      allAdSets = allAdSets.concat(data.data);
      url = data.paging?.next || null;
    }
    console.log(`Total de ad sets recuperados para campanha ${campaignId}: ${allAdSets.length}`);
    return allAdSets;
  } catch (error) {
    console.error("Erro ao buscar ad sets:", error.message);
    throw error;
  }
}

async function fetchInsightsMeta(accountId: string, since: string, until: string, accesstoken: string) {
  const url = `https://graph.facebook.com/v20.0/act_${accountId}/insights?fields=spend&time_range={"since":"${since}","until":"${until}"}&access_token=${accesstoken}`;
  try {
    console.log(`Buscando insights, URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar insights: ${await response.text()}`);
    }
    const data = await response.json();
    const spends = data.data.map(insight => parseInt(insight.spend || "0"));
    const totalSpent = spends.reduce((sum, spend) => sum + spend, 0);
    console.log(`Total gasto recuperado: ${totalSpent} centavos`);
    return totalSpent / 100; // Convert from centavos to main unit
  } catch (error) {
    console.error("Erro ao buscar insights:", error.message);
    throw error;
  }
}

async function calculateTotalBudgetMeta(accountId: string, reviewDate: string, accesstoken: string) {
  try {
    const reviewDateObj = new Date(reviewDate);
    const campaigns = await fetchCampaignsMeta(accountId, accesstoken);
    const budgetPromises = campaigns.map(async campaign => {
      if (campaign.status === 'ACTIVE') {
        const adSets = await fetchAdSets(campaign.id, accesstoken);
        let totalBudget = 0;
        let hasActiveAdSet = false;
        for (const adSet of adSets) {
          const end_time = adSet.end_time ? new Date(adSet.end_time) : null;
          if (adSet.status === 'ACTIVE' && (!end_time || end_time > reviewDateObj)) {
            hasActiveAdSet = true;
            totalBudget += parseInt(adSet.daily_budget || "0");
          }
        }
        if (hasActiveAdSet) {
          totalBudget += parseInt(campaign.daily_budget || "0");
        }
        return totalBudget;
      }
      return 0;
    });
    const budgets = await Promise.all(budgetPromises);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget, 0);
    console.log(`Orçamento total calculado: ${totalBudget} centavos`);
    return totalBudget / 100; // Convert from centavos to main unit
  } catch (error) {
    console.error("Erro ao calcular orçamento total:", error.message);
    throw error;
  }
}

serve(async (req) => {
  console.log("Função Edge daily-budget-reviews iniciada");

  // Tratar requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extrair dados da requisição
    const { method, clientId, reviewDate, accesstoken } = (await req.json()) as MetaAdsRequest;

    console.log(`Requisição recebida: método=${method}, clientId=${clientId}, data=${reviewDate}`);

    if (!method || !clientId || !reviewDate || !accesstoken) {
      console.error("Parâmetros obrigatórios ausentes na requisição");
      return new Response(
        JSON.stringify({
          error: "Parâmetros obrigatórios ausentes: method, clientId, reviewDate, accesstoken",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar dados do cliente para obter o ID da conta Meta
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Buscando dados do cliente no Supabase");

    const clientResponse = await fetch(
      `${supabaseUrl}/rest/v1/clients?select=*&id=eq.${clientId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!clientResponse.ok) {
      console.error("Erro ao buscar dados do cliente:", await clientResponse.text());
      return new Response(
        JSON.stringify({ error: "Erro ao buscar dados do cliente" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const clientData = await clientResponse.json();

    if (!clientData || clientData.length === 0) {
      console.error("Cliente não encontrado:", clientId);
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const client = clientData[0];
    console.log("Dados do cliente recuperados:", client.company_name, "ID da conta Meta:", client.meta_account_id);

    if (!client.meta_account_id) {
      console.error("Cliente não possui ID de conta Meta configurado");
      return new Response(
        JSON.stringify({ error: "Cliente não possui ID de conta Meta configurado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Obter dados da Meta Ads API
    if (method === "getMetaAdsData") {
      console.log("Buscando dados do Meta Ads para a conta", client.meta_account_id);

      try {
        // Parse reviewDate
        const reviewDateObj = new Date(reviewDate);
        const startOfMonth = new Date(reviewDateObj.getUTCFullYear(), reviewDateObj.getUTCMonth(), 1);
        const startOfMonthIso = startOfMonth.toISOString().split('T')[0];
        const daysInMonth = new Date(reviewDateObj.getUTCFullYear(), reviewDateObj.getUTCMonth() + 1, 0).getDate();
        const endOfMonth = new Date(reviewDateObj.getUTCFullYear(), reviewDateObj.getUTCMonth(), daysInMonth);
        const currentDay = reviewDateObj.getUTCDate();
        const remainingDays = daysInMonth - currentDay + 1;

        // Fetch total spend from Meta Ads
        const totalSpent = await fetchInsightsMeta(client.meta_account_id, startOfMonthIso, reviewDate, accesstoken);

        // Calculate total current daily budget from Meta Ads
        const currentDailyBudget = await calculateTotalBudgetMeta(client.meta_account_id, reviewDate, accesstoken);

        // Get allocated monthly budget from client
        const monthlyBudget = Number(client.meta_ads_budget);

        // Calculate remaining budget
        const remainingBudget = monthlyBudget - totalSpent;

        // Calculate ideal daily budget
        const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;

        // Prepare review data
        const reviewData = {
          client_id: clientId,
          review_date: reviewDate,
          meta_daily_budget_current: currentDailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: client.company_name,
        };

        // Registrar a revisão no banco de dados
        console.log("Registrando revisão no banco de dados");

        // Verificar se já existe uma revisão para hoje
        const existingReviewResponse = await fetch(
          `${supabaseUrl}/rest/v1/daily_budget_reviews?client_id=eq.${clientId}&review_date=eq.${reviewDate}`,
          {
            headers: {
              "Content-Type": "application/json",
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
            },
          }
        );

        if (!existingReviewResponse.ok) {
          console.error("Erro ao verificar revisão existente:", await existingReviewResponse.text());
          throw new Error("Erro ao verificar revisão existente");
        }

        const existingReviews = await existingReviewResponse.json();
        let reviewId;

        if (existingReviews && existingReviews.length > 0) {
          // Atualizar revisão existente
          console.log("Atualizando revisão existente");
          reviewId = existingReviews[0].id;

          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/daily_budget_reviews?id=eq.${reviewId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Prefer": "return=minimal",
              },
              body: JSON.stringify({
                meta_daily_budget_current: currentDailyBudget,
                meta_total_spent: totalSpent,
                updated_at: new Date().toISOString(),
              }),
            }
          );

          if (!updateResponse.ok) {
            console.error("Erro ao atualizar revisão:", await updateResponse.text());
            throw new Error("Erro ao atualizar revisão");
          }
        } else {
          // Criar nova revisão
          console.log("Criando nova revisão");

          const insertResponse = await fetch(
            `${supabaseUrl}/rest/v1/daily_budget_reviews`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Prefer": "return=representation",
              },
              body: JSON.stringify({
                ...reviewData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }),
            }
          );

          if (!insertResponse.ok) {
            console.error("Erro ao criar revisão:", await insertResponse.text());
            throw new Error("Erro ao criar revisão");
          }

          const insertedReview = await insertResponse.json();
          reviewId = insertedReview[0].id;
        }

        console.log("Revisão registrada com sucesso, ID:", reviewId);

        // Retornar resultado da análise
        return new Response(
          JSON.stringify({
            status: "success",
            message: "Análise realizada com sucesso via API do Meta Ads",
            client: client,
            reviewId: reviewId,
            meta: {
              totalSpent: totalSpent,
              currentDailyBudget: currentDailyBudget,
              idealDailyBudget: idealDailyBudget,
              remainingBudget: remainingBudget,
              remainingDays: remainingDays,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Erro ao processar dados do Meta Ads:", error.message, error.stack);
        return new Response(
          JSON.stringify({
            error: `Erro ao processar dados do Meta Ads: ${error.message || "Erro desconhecido"}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.error("Método não suportado:", method);
      return new Response(
        JSON.stringify({ error: `Método não suportado: ${method}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Erro na função Edge:", error.message, error.stack);
    return new Response(
      JSON.stringify({
        error: `Erro interno na função Edge: ${error.message || "Erro desconhecido"}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
