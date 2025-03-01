
// src/functions/daily-budget-reviews/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para verificar se a solicitação é uma verificação OPTIONS CORS
const handleCors = (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
};

// Função para conectar-se à API do Meta Ads e obter dados reais
async function getMetaAdsInsights(accountId: string, accessToken: string, date: string) {
  try {
    // A API do Meta Ads requer datas no formato YYYY-MM-DD
    // Usamos a data atual como parâmetro para o período "since"
    const today = new Date(date);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Formatando as datas para o formato esperado pela API
    const since = firstDayOfMonth.toISOString().split('T')[0];
    const until = date;
    
    console.log(`Obtendo insights da conta ${accountId} no período de ${since} até ${until}`);
    
    // Construir a URL da API do Meta Ads
    const apiUrl = `https://graph.facebook.com/v19.0/act_${accountId}/insights?fields=spend&time_range[since]=${since}&time_range[until]=${until}&access_token=${accessToken}`;
    
    // Fazer a solicitação à API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API do Meta Ads:", errorData);
      throw new Error(`Erro ao obter insights: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log("Resposta da API do Meta Ads:", data);
    
    // Extrair o valor real de gasto
    let totalSpent = 0;
    if (data.data && data.data.length > 0) {
      totalSpent = parseFloat(data.data[0].spend || "0");
    }
    
    // Obter orçamento diário atual
    const dailyBudgetUrl = `https://graph.facebook.com/v19.0/act_${accountId}/adspixels?fields=daily_spend_limit&access_token=${accessToken}`;
    const budgetResponse = await fetch(dailyBudgetUrl);
    
    let currentDailyBudget = 0;
    if (budgetResponse.ok) {
      const budgetData = await budgetResponse.json();
      if (budgetData.data && budgetData.data.length > 0) {
        currentDailyBudget = parseFloat(budgetData.data[0].daily_spend_limit || "0") / 100; // Converter de centavos para reais
      }
    }
    
    return {
      totalSpent,
      currentDailyBudget
    };
  } catch (error) {
    console.error("Erro ao obter insights do Meta Ads:", error);
    throw error;
  }
}

// Função principal do serviço
serve(async (req: Request) => {
  // Verificar se é uma solicitação OPTIONS para CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    // Obter o corpo da solicitação
    const { method, clientId, reviewDate, accessToken, tokens } = await req.json();
    
    // Método para salvar tokens de API
    if (method === "saveTokens" && Array.isArray(tokens)) {
      for (const token of tokens) {
        // Verificar se o token já existe
        const { data: existingToken } = await supabaseClient
          .from("api_tokens")
          .select("id")
          .eq("name", token.name)
          .maybeSingle();
        
        if (existingToken) {
          // Atualizar token existente
          await supabaseClient
            .from("api_tokens")
            .update({ value: token.value })
            .eq("id", existingToken.id);
        } else {
          // Inserir novo token
          await supabaseClient
            .from("api_tokens")
            .insert({ name: token.name, value: token.value });
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, message: "Tokens salvos com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Método para obter dados reais do Meta Ads
    if (method === "getMetaAdsData" && clientId && reviewDate && accessToken) {
      // Obter dados do cliente
      const { data: client, error: clientError } = await supabaseClient
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (clientError) {
        throw new Error(`Cliente não encontrado: ${clientError.message}`);
      }
      
      if (!client.meta_account_id) {
        throw new Error("Cliente não possui ID de conta Meta configurado");
      }
      
      // Buscar dados reais da API do Meta Ads
      const metaAdsData = await getMetaAdsInsights(
        client.meta_account_id,
        accessToken,
        reviewDate
      );
      
      // Verificar se já existe uma revisão para esta data e cliente
      const { data: existingReview, error: checkError } = await supabaseClient
        .from("daily_budget_reviews")
        .select("id")
        .eq("client_id", clientId)
        .eq("review_date", reviewDate)
        .maybeSingle();
      
      let reviewId;
      
      // Dados para inserção/atualização
      const reviewData = {
        client_id: clientId,
        review_date: reviewDate,
        meta_daily_budget_current: metaAdsData.currentDailyBudget,
        meta_total_spent: metaAdsData.totalSpent,
        meta_account_id: client.meta_account_id,
        meta_account_name: client.company_name,
        updated_at: new Date().toISOString()
      };
      
      // Se já existe uma revisão, atualizar, senão inserir nova
      if (existingReview) {
        const { data, error } = await supabaseClient
          .from("daily_budget_reviews")
          .update(reviewData)
          .eq("id", existingReview.id)
          .select()
          .single();
        
        if (error) throw error;
        reviewId = existingReview.id;
      } else {
        const { data, error } = await supabaseClient
          .from("daily_budget_reviews")
          .insert(reviewData)
          .select()
          .single();
        
        if (error) throw error;
        reviewId = data?.id;
      }
      
      return new Response(
        JSON.stringify({
          status: "success",
          message: "Análise com dados reais concluída com sucesso",
          client: client,
          reviewId: reviewId,
          meta_data: metaAdsData
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Se o método não for reconhecido
    return new Response(
      JSON.stringify({ error: "Método não reconhecido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro na execução da função Edge:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
