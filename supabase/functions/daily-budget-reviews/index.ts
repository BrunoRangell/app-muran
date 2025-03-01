
// Função Edge para análise de orçamentos diários e API Meta
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge function daily-budget-reviews iniciada");
    
    // Parse request body
    const payload = await req.json();
    console.log("Payload recebido:", JSON.stringify(payload, null, 2));
    
    // Validar os parâmetros obrigatórios
    if (!payload.clientId) {
      throw new Error("clientId é obrigatório");
    }

    if (!payload.accessToken) {
      throw new Error("accessToken é obrigatório");
    }

    if (!payload.reviewDate) {
      throw new Error("reviewDate é obrigatório");
    }

    if (!payload.metaAccountId) {
      throw new Error("ID de conta Meta não encontrado para o cliente");
    }

    // Criar cliente Supabase com a service role key para acessar o banco de dados
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );
    
    // Obter cliente
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, company_name, meta_account_id')
      .eq('id', payload.clientId)
      .maybeSingle();
      
    if (clientError) {
      console.error("Erro ao buscar cliente:", clientError);
      throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
    }
    
    if (!client) {
      throw new Error("Cliente não encontrado");
    }
    
    if (!client.meta_account_id) {
      throw new Error("Cliente sem ID de conta Meta configurado");
    }
    
    console.log("Cliente encontrado:", client.company_name, "ID Meta:", client.meta_account_id);
    
    // Dados de exemplo - simulando dados que viriam da API do Meta
    // Em uma implementação real, aqui você chamaria a API do Meta com o token
    const mockMetaData = {
      dailyBudget: 100.00,
      totalSpent: 75.50,
    };
    
    console.log("Dados obtidos da Meta (simulado):", mockMetaData);
    
    // Verificar se já existe uma revisão para este cliente e data
    const { data: existingReview, error: reviewError } = await supabaseAdmin
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', payload.clientId)
      .eq('review_date', payload.reviewDate)
      .maybeSingle();
      
    if (reviewError) {
      console.error("Erro ao verificar revisão existente:", reviewError);
      throw new Error(`Erro ao verificar revisão existente: ${reviewError.message}`);
    }
    
    let reviewId = null;
    
    if (existingReview) {
      // Atualizar revisão existente
      console.log("Atualizando revisão existente:", existingReview.id);
      
      const { data, error } = await supabaseAdmin.rpc(
        'update_daily_budget_review',
        {
          p_id: existingReview.id,
          p_meta_daily_budget_current: mockMetaData.dailyBudget,
          p_meta_total_spent: mockMetaData.totalSpent
        }
      );
      
      if (error) {
        console.error("Erro ao atualizar revisão:", error);
        throw new Error(`Erro ao atualizar revisão: ${error.message}`);
      }
      
      reviewId = existingReview.id;
    } else {
      // Inserir nova revisão
      console.log("Criando nova revisão para o cliente:", payload.clientId);
      
      const { data, error } = await supabaseAdmin.rpc(
        'insert_daily_budget_review',
        {
          p_client_id: payload.clientId,
          p_review_date: payload.reviewDate,
          p_meta_daily_budget_current: mockMetaData.dailyBudget,
          p_meta_total_spent: mockMetaData.totalSpent,
          p_meta_account_id: client.meta_account_id,
          p_meta_account_name: client.company_name // Usar nome da empresa como nome da conta Meta
        }
      );
      
      if (error) {
        console.error("Erro ao inserir revisão:", error);
        throw new Error(`Erro ao inserir revisão: ${error.message}`);
      }
      
      reviewId = data;
    }
    
    console.log("Revisão salva com sucesso, ID:", reviewId);
    
    // Retornar resultado da análise
    return new Response(
      JSON.stringify({
        success: true,
        reviewId: reviewId,
        client: client,
        meta: {
          dailyBudget: mockMetaData.dailyBudget,
          totalSpent: mockMetaData.totalSpent,
          accountId: client.meta_account_id
        },
        message: "Análise de orçamento realizada com sucesso"
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      },
    );
  } catch (error) {
    console.error("Erro na função Edge:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro desconhecido na análise de orçamento"
      }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      },
    );
  }
});
