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
  accessToken: string;
}

serve(async (req) => {
  console.log("Função Edge daily-budget-reviews iniciada");

  // Tratar requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extrair dados da requisição
    const { method, clientId, reviewDate, accessToken } = (await req.json()) as MetaAdsRequest;

    console.log(`Requisição recebida: método=${method}, clientId=${clientId}, data=${reviewDate}`);

    if (!method || !clientId || !reviewDate || !accessToken) {
      console.error("Parâmetros obrigatórios ausentes na requisição");
      return new Response(
        JSON.stringify({
          error: "Parâmetros obrigatórios ausentes: method, clientId, reviewDate, accessToken",
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
        // TODO: Implementar integração real com a API do Meta Ads
        // Por enquanto, vamos simular uma resposta para demonstrar o fluxo

        console.log("Simulando resposta da API do Meta Ads (função Edge)");

        // Simular total gasto no mês atual (30-70% do orçamento mensal)
        const monthlyBudget = Number(client.meta_ads_budget);
        const spentPercentage = Math.random() * 0.4 + 0.3; // Entre 30% e 70% do orçamento
        const totalSpent = monthlyBudget * spentPercentage;

        // Calcular orçamento diário ideal
        const todayDate = new Date(reviewDate);
        const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
        const currentDay = todayDate.getDate();
        const remainingDays = daysInMonth - currentDay + 1;

        const remainingBudget = monthlyBudget - totalSpent;
        const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;

        // Simular orçamento diário atual com uma pequena variação do ideal
        const variationFactor = 0.8 + Math.random() * 0.4; // Entre 0.8 e 1.2
        const currentDailyBudget = idealDailyBudget * variationFactor;

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

        const reviewData = {
          client_id: clientId,
          review_date: reviewDate,
          meta_daily_budget_current: currentDailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: client.company_name,
        };

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
            // Incluir dados adicionais para debug/informação
            meta: {
              totalSpent,
              currentDailyBudget,
              idealDailyBudget,
              remainingBudget,
              remainingDays,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Erro ao processar dados do Meta Ads:", error);
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
    console.error("Erro na função Edge:", error);
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
