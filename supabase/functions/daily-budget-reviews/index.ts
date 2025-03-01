
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Definir interface para os tipos de parâmetros e respostas
interface AnalyzeClientParams {
  method: string;
  clientId: string;
}

interface ApiResponse {
  status: "success" | "error";
  message: string;
  data?: any;
  error?: any;
}

serve(async (req) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  try {
    // Inicializar cliente Supabase a partir do ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Verificar configurações
    if (!supabaseUrl || !supabaseKey) {
      console.error("Variáveis de ambiente não configuradas corretamente");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Configuração do servidor incompleta",
        }),
        { headers, status: 500 }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair parâmetros
    let params: AnalyzeClientParams;
    try {
      params = await req.json();
    } catch (error) {
      console.error("Erro ao processar JSON:", error);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Parâmetros inválidos",
          error,
        }),
        { headers, status: 400 }
      );
    }

    // Verificar método solicitado
    if (params.method === "analyzeClient") {
      return await handleAnalyzeClient(params, supabase, headers);
    } 

    // Método não suportado
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Método não suportado",
      }),
      { headers, status: 400 }
    );
    
  } catch (error) {
    console.error("Erro não tratado:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Erro interno do servidor",
        error: error.message,
      }),
      { headers, status: 500 }
    );
  }
});

// Função para analisar dados do cliente e fazer revisão de orçamento
async function handleAnalyzeClient(
  params: AnalyzeClientParams,
  supabase: any,
  headers: HeadersInit
): Promise<Response> {
  try {
    const { clientId } = params;
    
    if (!clientId) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "ID do cliente é obrigatório",
        }),
        { headers, status: 400 }
      );
    }

    console.log(`Iniciando análise para cliente ID: ${clientId}`);

    // Buscar dados do cliente
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError) {
      console.error("Erro ao buscar cliente:", clientError);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Cliente não encontrado",
          error: clientError,
        }),
        { headers, status: 404 }
      );
    }

    // Verificar se o cliente tem ID da conta e orçamento configurados
    if (!client.meta_account_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "O cliente não possui um ID de conta Meta configurado",
        }),
        { headers, status: 400 }
      );
    }

    if (!client.meta_ads_budget || client.meta_ads_budget <= 0) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "O cliente não possui um orçamento Meta Ads configurado",
        }),
        { headers, status: 400 }
      );
    }

    console.log(`Cliente encontrado: ${client.company_name}`);

    // Em um cenário real, aqui você faria uma chamada para a API do Facebook
    // para obter os dados reais da conta. Para este exemplo, simularemos os dados.

    // Obter tokens da API Meta (em uma implementação real)
    const { data: tokens, error: tokensError } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "META_API_TOKEN")
      .maybeSingle();

    if (tokensError) {
      console.log("Aviso: token Meta API não encontrado, usando simulação");
    }

    // Simulação de dados de orçamento diário e gasto
    // Em uma implementação real, você usaria o tokens.value para autenticar com a API do Meta
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    
    // Cálculos simulados
    const idealDailyBudget = client.meta_ads_budget / daysInMonth;
    
    // Simular um valor entre 80% e 120% do ideal para o orçamento atual
    const variationFactor = 0.8 + Math.random() * 0.4; // Entre 0.8 e 1.2
    const currentDailyBudget = idealDailyBudget * variationFactor;
    
    // Calcular uma porcentagem de gasto do orçamento mensal (entre 20% e 90%)
    const spentPercentage = 0.2 + Math.random() * 0.7;
    const totalSpent = client.meta_ads_budget * spentPercentage;

    // Data da revisão (hoje)
    const today = new Date().toISOString().split('T')[0];

    // Verificar se já existe uma revisão para hoje
    const { data: existingReview, error: checkError } = await supabase
      .from("daily_budget_reviews")
      .select("id")
      .eq("client_id", clientId)
      .eq("review_date", today)
      .maybeSingle();
      
    if (checkError) {
      console.error("Erro ao verificar revisão existente:", checkError);
    }

    let reviewId;
    
    // Se já existe uma revisão para hoje, atualizamos, senão inserimos uma nova
    if (existingReview) {
      console.log("Atualizando revisão existente");
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .update({
          meta_daily_budget_current: currentDailyBudget,
          meta_daily_budget_recommended: idealDailyBudget,
          meta_total_spent: totalSpent,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingReview.id)
        .select();
        
      if (error) {
        console.error("Erro ao atualizar revisão:", error);
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Erro ao atualizar revisão",
            error,
          }),
          { headers, status: 500 }
        );
      }
      
      reviewId = existingReview.id;
    } else {
      console.log("Criando nova revisão");
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .insert({
          client_id: clientId,
          review_date: today,
          meta_daily_budget_current: currentDailyBudget,
          meta_daily_budget_recommended: idealDailyBudget,
          meta_total_spent: totalSpent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error("Erro ao criar revisão:", error);
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Erro ao criar revisão",
            error,
          }),
          { headers, status: 500 }
        );
      }
      
      reviewId = data?.[0]?.id;
    }

    // Retornar resultado da análise
    const result: ApiResponse = {
      status: "success",
      message: "Análise de orçamento concluída com sucesso",
      data: {
        client,
        reviewId,
        analysis: {
          currentDailyBudget,
          idealDailyBudget,
          totalSpent,
          reviewDate: today
        }
      }
    };

    console.log("Análise concluída com sucesso");
    return new Response(JSON.stringify(result), { headers, status: 200 });
    
  } catch (error) {
    console.error("Erro ao analisar cliente:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Erro ao analisar cliente",
        error: error.message,
      }),
      { headers, status: 500 }
    );
  }
}
