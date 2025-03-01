
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração do cliente Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Verificar CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    // Extrair token JWT para verificação
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar método
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Processar corpo da requisição
    const body = await req.json();
    console.log("Requisição recebida:", body);

    // Verificar método solicitado
    if (body.method === "analyzeClient") {
      return await analyzeClient(body.clientId);
    } else {
      return new Response(JSON.stringify({ error: "Método não reconhecido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Erro no servidor:", error);
    return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function analyzeClient(clientId: string) {
  try {
    console.log(`Iniciando análise para cliente ${clientId}`);
    
    // 1. Buscar dados do cliente
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      console.error("Erro ao buscar cliente:", clientError);
      return new Response(JSON.stringify({ error: `Cliente não encontrado: ${clientError?.message}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar se o cliente tem orçamento e ID da conta
    if (!client.meta_account_id) {
      return new Response(JSON.stringify({ error: "O cliente não possui ID da conta Meta configurado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!client.meta_ads_budget || client.meta_ads_budget <= 0) {
      return new Response(JSON.stringify({ error: "O cliente não possui orçamento Meta Ads configurado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Dados do cliente encontrados:", client);

    // 2. Nesta versão simplificada, vamos gerar dados simulados
    // Em produção, esta parte faria a consulta à API do Meta
    const today = new Date();
    const dataSimulada = {
      meta_daily_budget_current: (client.meta_ads_budget / 30) * (0.7 + Math.random() * 0.6), // Orçamento diário atual (simulado)
      meta_total_spent: client.meta_ads_budget * 0.4 * Math.random(), // Gasto total do mês (simulado)
    };

    console.log("Dados simulados gerados:", dataSimulada);

    // 3. Salvar revisão diária
    const reviewDate = today.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    // Verificar se já existe uma revisão para este cliente nesta data
    const { data: existingReview, error: existingError } = await supabase
      .from("daily_budget_reviews")
      .select("id")
      .eq("client_id", clientId)
      .eq("review_date", reviewDate)
      .maybeSingle();

    console.log("Verificação de revisão existente:", existingReview, existingError);

    // Dados para inserção/atualização
    const reviewData = {
      client_id: clientId,
      review_date: reviewDate,
      meta_daily_budget_current: dataSimulada.meta_daily_budget_current,
      meta_total_spent: dataSimulada.meta_total_spent,
    };

    let result;
    if (existingReview?.id) {
      // Atualizar revisão existente
      console.log("Atualizando revisão existente:", existingReview.id);
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .update(reviewData)
        .eq("id", existingReview.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar revisão:", error);
        throw error;
      }
      
      result = data;
      console.log("Revisão atualizada com sucesso:", result);
    } else {
      // Criar nova revisão
      console.log("Criando nova revisão");
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar revisão:", error);
        throw error;
      }
      
      result = data;
      console.log("Revisão criada com sucesso:", result);
    }

    // 4. Retornar dados atualizados
    return new Response(
      JSON.stringify({
        success: true,
        client,
        review: result,
        message: "Análise concluída com sucesso",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao analisar cliente:", error);
    return new Response(
      JSON.stringify({ 
        error: `Erro ao analisar cliente: ${error.message}`,
        details: error 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
