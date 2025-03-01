
// supabase/functions/daily-budget-reviews/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função Edge 'daily-budget-reviews' carregada - v1.0.4");

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
      },
    });
  }

  try {
    console.log(`Requisição ${req.method} recebida`);
    
    // Validação inicial do corpo da requisição
    let reqBody;
    let requestText;
    
    try {
      requestText = await req.text();
      console.log("Corpo da requisição recebido:", requestText.length > 0 ? "Não vazio" : "VAZIO");
      
      if (!requestText || requestText.trim() === "") {
        throw new Error("Corpo da requisição vazio");
      }
      
      reqBody = JSON.parse(requestText);
      console.log("Método solicitado:", reqBody.method || "Não especificado");
    } catch (err) {
      console.error("Erro ao processar corpo da requisição:", err.message);
      console.error("Texto recebido:", requestText);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: err.message || "Erro ao processar requisição",
          error: { message: err.message, raw: requestText },
        }),
        {
          status: 200, // Retornar 200 mesmo com erro para evitar problemas de CORS
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Responder a um ping simples para testes de conectividade
    if (reqBody.method === "ping") {
      console.log("Ping recebido, respondendo...");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Pong! A função Edge está funcionando corretamente.",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Processamento principal - análise de dados Meta Ads
    if (reqBody.method === "getMetaAdsData") {
      console.log("Solicitação de análise de dados Meta Ads recebida");
      
      // Validação dos parâmetros obrigatórios
      const { metaAccountId, accessToken, dateRange } = reqBody;
      
      if (!metaAccountId) {
        throw new Error("ID da conta Meta Ads não fornecido");
      }
      
      if (!accessToken) {
        throw new Error("Token de acesso não fornecido");
      }
      
      if (!dateRange || !dateRange.start || !dateRange.end) {
        throw new Error("Período de análise não fornecido corretamente");
      }
      
      console.log(`Analisando conta ${metaAccountId} no período de ${dateRange.start} a ${dateRange.end}`);
      
      try {
        // Construir URL da API Meta
        const fields = "status,name,spend,insights{spend}";
        const apiUrl = `https://graph.facebook.com/v20.0/act_${metaAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`;
        
        console.log("Chamando API Meta...");
        
        // Chamar a API Meta
        const metaResponse = await fetch(apiUrl);
        const metaData = await metaResponse.json();
        
        console.log("Resposta da API Meta recebida:", metaData.data ? `${metaData.data.length} campanhas` : "Sem dados");
        
        // Verificar se há erro na resposta da Meta
        if (metaData.error) {
          console.error("Erro na API Meta:", metaData.error);
          throw new Error(`Erro na API Meta: ${metaData.error.message || JSON.stringify(metaData.error)}`);
        }
        
        // Processar campanhas e calcular gastos
        const campaigns = metaData.data || [];
        let totalSpent = 0;
        
        const processedCampaigns = campaigns.map((campaign: any) => {
          const spend = parseFloat(campaign.spend || "0");
          totalSpent += spend;
          
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend: spend
          };
        });
        
        // Calcular orçamento diário (valor aproximado baseado no total gasto)
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const estimatedDailyBudget = parseFloat((totalSpent / daysDiff).toFixed(2));
        
        console.log(`Total gasto: ${totalSpent}, Orçamento diário estimado: ${estimatedDailyBudget}`);
        
        // Montar resposta
        const result = {
          success: true,
          message: "Dados obtidos com sucesso",
          meta: {
            totalSpent: totalSpent,
            dailyBudget: estimatedDailyBudget,
            dateRange: dateRange,
            campaigns: processedCampaigns
          }
        };
        
        console.log("Retornando resultados processados");
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      } catch (metaError) {
        console.error("Erro ao processar dados da Meta:", metaError.message);
        
        throw new Error(`Erro na API do Meta Ads: ${metaError.message}`);
      }
    }
    
    // Se chegou aqui, o método solicitado não é suportado
    return new Response(
      JSON.stringify({
        success: false,
        message: `Método '${reqBody.method}' não suportado`,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Erro não tratado na função Edge:", err);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Erro interno no servidor",
        error: {
          message: err.message,
          stack: err.stack,
        }
      }),
      {
        status: 200, // Retornar 200 mesmo com erro para evitar problemas de CORS
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
