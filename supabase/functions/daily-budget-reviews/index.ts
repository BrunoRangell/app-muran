
import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { DateTime } from "https://esm.sh/luxon@3.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Token {
  name: string;
  value: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Criar cliente Supabase com a chave de serviço
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair informações da requisição
    const { method, tokens, clientId } = await req.json();

    // Função para salvar tokens na tabela api_tokens
    if (method === "saveTokens" && tokens) {
      console.log("Iniciando salvamento de tokens...");
      
      for (const token of tokens) {
        const { error } = await supabase
          .from("api_tokens")
          .upsert(
            { name: token.name, value: token.value },
            { onConflict: "name" }
          );
        
        if (error) {
          console.error(`Erro ao salvar token ${token.name}:`, error);
          throw new Error(`Erro ao salvar token ${token.name}: ${error.message}`);
        }
      }
      
      console.log("Tokens salvos com sucesso!");
      return new Response(
        JSON.stringify({ success: true, message: "Tokens salvos com sucesso" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Função para analisar um cliente específico
    if (method === "analyzeClient" && clientId) {
      console.log(`Iniciando análise para cliente ID: ${clientId}`);
      
      // Buscar o cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (clientError) {
        throw new Error(`Cliente não encontrado: ${clientError.message}`);
      }
      
      // Buscar os tokens necessários
      const { data: apiTokens, error: tokensError } = await supabase
        .from("api_tokens")
        .select("name, value");
      
      if (tokensError) {
        throw new Error(`Erro ao buscar tokens: ${tokensError.message}`);
      }
      
      const tokenMap = apiTokens.reduce((acc, token) => {
        acc[token.name] = token.value;
        return acc;
      }, {} as Record<string, string>);
      
      // Verificar se temos todos os tokens necessários
      const requiredTokens = [
        "meta_access_token",
        "clickup_token",
        "space_id",
        "google_developer_token",
        "google_oauth2_token",
        "manager_customer_id"
      ];
      
      const missingTokens = requiredTokens.filter(token => !tokenMap[token]);
      if (missingTokens.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Tokens ausentes: ${missingTokens.join(", ")}`,
            missingTokens,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      
      // Simular o processo de análise
      // Em uma implementação real, aqui você faria as chamadas para Meta Ads e Google Ads
      // seguindo a lógica que você compartilhou no código do bot
      
      // Por enquanto, vamos criar uma entrada de revisão de orçamento simulada
      const today = DateTime.now().setZone("America/Sao_Paulo");
      const daysLeft = today.daysInMonth - today.day + 1;
      
      // Orçamentos obtidos do cliente
      const metaBudget = client.meta_ads_budget || 0;
      const googleBudget = client.google_ads_budget || 0;
      
      // Valores simulados
      // Em uma implementação real, estes viriam das APIs
      const metaSpent = metaBudget * 0.6; // Simulamos ter gasto 60% do orçamento
      const googleSpent = googleBudget * 0.55; // Simulamos ter gasto 55% do orçamento
      
      const metaCurrentDaily = metaBudget * 0.03; // Simulamos 3% do orçamento como atual
      const googleCurrentDaily = googleBudget * 0.028; // Simulamos 2.8% do orçamento como atual
      
      // Cálculos
      const metaRemaining = metaBudget - metaSpent;
      const googleRemaining = googleBudget - googleSpent;
      
      const metaIdealDaily = metaRemaining / daysLeft;
      const googleIdealDaily = googleRemaining / daysLeft;
      
      const metaRecommendation = metaIdealDaily > metaCurrentDaily
        ? `Aumentar em R$${(metaIdealDaily - metaCurrentDaily).toFixed(2)}`
        : `Diminuir em R$${(metaCurrentDaily - metaIdealDaily).toFixed(2)}`;
      
      const googleRecommendation = googleIdealDaily > googleCurrentDaily
        ? `Aumentar em R$${(googleIdealDaily - googleCurrentDaily).toFixed(2)}`
        : `Diminuir em R$${(googleCurrentDaily - googleIdealDaily).toFixed(2)}`;
      
      // Inserir os dados da revisão no banco
      const { data: review, error: reviewError } = await supabase
        .from("daily_budget_reviews")
        .upsert({
          client_id: clientId,
          review_date: today.toISODate(),
          meta_budget_available: metaBudget,
          meta_total_spent: metaSpent,
          meta_daily_budget_current: metaCurrentDaily,
          meta_daily_budget_ideal: metaIdealDaily,
          meta_recommendation: metaRecommendation,
          google_budget_available: googleBudget,
          google_total_spent: googleSpent,
          google_daily_budget_current: googleCurrentDaily,
          google_daily_budget_ideal: googleIdealDaily,
          google_avg_last_five_days: googleCurrentDaily * 0.95, // Simulado
          google_recommendation: googleRecommendation,
          meta_account_id: client.meta_account_id || "não configurado",
          google_account_id: client.google_account_id || "não configurado",
          meta_account_name: "Conta Meta " + client.company_name,
          google_account_name: "Conta Google " + client.company_name
        }, {
          onConflict: "client_id,review_date"
        })
        .select()
        .single();
      
      if (reviewError) {
        throw new Error(`Erro ao salvar revisão: ${reviewError.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          client,
          review: review || null,
          message: "Análise concluída com sucesso",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Método não reconhecido
    return new Response(
      JSON.stringify({ error: "Método não reconhecido" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
