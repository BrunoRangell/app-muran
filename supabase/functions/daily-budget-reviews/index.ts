
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Definir cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

console.log("Edge Function daily-budget-reviews - Inicializada");

serve(async (req) => {
  // Tratamento de requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    console.log("Recebida requisição OPTIONS (CORS preflight)");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log(`Recebida requisição ${req.method} para função daily-budget-reviews`);
    
    // Extrair os dados da requisição
    let payload;
    try {
      payload = await req.json();
      console.log("Payload recebido:", JSON.stringify(payload));
    } catch (error) {
      console.error("Erro ao processar JSON da requisição:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Erro ao processar JSON da requisição" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verificar se é uma requisição de ping para teste
    if (payload.method === 'ping') {
      console.log("Requisição de ping recebida, respondendo com sucesso");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Função Edge está online",
          timestamp: new Date().toISOString(),
          version: "1.0.0"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verificar se temos um método definido
    if (!payload.method) {
      console.error("Método não especificado no payload");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Método não especificado na requisição" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Tratar método getMetaAdsData
    if (payload.method === 'getMetaAdsData') {
      console.log("Processando requisição getMetaAdsData");
      
      // Verificar parâmetros obrigatórios
      if (!payload.accessToken) {
        console.error("Token de acesso não fornecido");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Token de acesso do Meta Ads não fornecido" 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (!payload.metaAccountId) {
        console.error("ID da conta Meta não fornecido");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "ID da conta Meta Ads não fornecido" 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Para fins de teste, vamos simplesmente retornar dados simulados
      // Em ambiente de produção, faríamos a chamada real para a API do Meta Ads
      console.log("Gerando dados simulados para resposta");
      
      // Construir resposta com dados simulados
      const simulatedResponse = {
        success: true,
        message: "Dados obtidos com sucesso (simulados)",
        meta_total_spent: 1250.75,
        meta_daily_budget_current: 75.00,
        meta: {
          totalSpent: 1250.75,
          dailyBudget: 75.00,
          dateRange: {
            start: "2025-03-01",
            end: "2025-03-31"
          },
          campaigns: [
            {
              id: "123456789",
              name: "Campanha Principal",
              status: "ACTIVE",
              spend: 750.75
            },
            {
              id: "987654321",
              name: "Campanha Secundária",
              status: "PAUSED",
              spend: 500.00
            }
          ]
        }
      };
      
      console.log("Enviando resposta com dados simulados");
      return new Response(
        JSON.stringify(simulatedResponse),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Se chegamos aqui, o método solicitado não é suportado
    console.error(`Método '${payload.method}' não suportado`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Método '${payload.method}' não suportado` 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    // Tratar erros gerais
    console.error("Erro na execução da função Edge:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erro interno: ${error.message}`,
        error: error.toString(),
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
