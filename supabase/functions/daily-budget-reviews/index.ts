
// Arquivo: supabase/functions/daily-budget-reviews/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuração de CORS para permitir chamadas do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  console.log("Função Edge iniciada:", new Date().toISOString());
  
  // Tratamento padrão para requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log("Requisição OPTIONS recebida (CORS preflight)");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Extrair dados da requisição
    const requestData = await req.json();
    console.log("Dados recebidos:", JSON.stringify(requestData));
    
    // Verificar se é apenas um ping para testar a conectividade
    if (requestData.method === "ping") {
      console.log("Requisição de ping recebida");
      return new Response(
        JSON.stringify({ 
          message: "Função Edge está operacional", 
          timestamp: new Date().toISOString(),
          success: true 
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Se não for um ping, processar como uma requisição normal para obter dados do Meta Ads
    if (requestData.method === "getMetaAdsData") {
      console.log("Requisição para obter dados do Meta Ads");
      
      // Extrair os dados necessários da requisição
      const { accessToken, metaAccountId, dateRange } = requestData;
      
      if (!accessToken) {
        throw new Error("Token de acesso não fornecido");
      }
      
      if (!metaAccountId) {
        throw new Error("ID da conta do Meta Ads não fornecido");
      }
      
      console.log("Período de análise:", dateRange);
      
      // Implementar a chamada à API do Meta Ads aqui
      // Por enquanto, retornamos um mock para teste
      const mockData = {
        meta: {
          totalSpent: 1250.35,
          dailyBudget: 100.00,
          dateRange: dateRange || { 
            start: new Date().toISOString().split('T')[0], 
            end: new Date().toISOString().split('T')[0] 
          },
          campaigns: [
            {
              id: "123456789",
              name: "Campanha de Teste 1",
              status: "ACTIVE",
              spend: 450.20
            },
            {
              id: "987654321",
              name: "Campanha de Teste 2",
              status: "PAUSED",
              spend: 800.15
            }
          ]
        },
        success: true,
        message: "Dados obtidos com sucesso (simulação)"
      };
      
      return new Response(
        JSON.stringify(mockData),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Método desconhecido
    throw new Error(`Método não reconhecido: ${requestData.method}`);

  } catch (error) {
    console.error("Erro na função Edge:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Erro interno na função Edge",
        success: false,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
