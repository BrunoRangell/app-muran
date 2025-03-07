
// supabase/functions/daily-budget-reviews/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configuração CORS para permitir acesso da aplicação frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

console.log("Função Edge 'daily-budget-reviews' carregada - v1.1.0");

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
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
      const { metaAccountId, accessToken, clientId } = reqBody;
      
      // Definir dateRange para o mês atual (do dia 1 até hoje)
      const now = new Date();
      const dateRange = {
        start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, // Primeiro dia do mês
        end: now.toISOString().split('T')[0] // Hoje
      };
      
      console.log(`Período de análise definido: ${dateRange.start} a ${dateRange.end}`);
      
      if (!metaAccountId) {
        throw new Error("ID da conta Meta Ads não fornecido");
      }
      
      if (!accessToken) {
        throw new Error("Token de acesso não fornecido");
      }
      
      console.log(`Analisando conta ${metaAccountId} no período de ${dateRange.start} a ${dateRange.end}`);
      
      try {
        // Construir URL da API Meta para campanhas
        const campaignsFields = "id,name,status";
        const campaignsApiUrl = `https://graph.facebook.com/v20.0/act_${metaAccountId}/campaigns?fields=${campaignsFields}&access_token=${accessToken}&limit=500`;
        
        console.log("Chamando API Meta para buscar campanhas...");
        
        // Chamar a API Meta para buscar campanhas
        const campaignsResponse = await fetch(campaignsApiUrl);
        const campaignsData = await campaignsResponse.json();
        
        // Verificar se há erro na resposta da Meta para campanhas
        if (campaignsData.error) {
          console.error("Erro na API Meta (campanhas):", campaignsData.error);
          throw new Error(`Erro na API Meta: ${campaignsData.error.message || JSON.stringify(campaignsData.error)}`);
        }
        
        // Verificar se temos campanhas para processar
        const campaigns = campaignsData.data || [];
        console.log(`Encontradas ${campaigns.length} campanhas`);
        
        if (campaigns.length === 0) {
          console.log("Nenhuma campanha encontrada para a conta");
          return new Response(
            JSON.stringify({
              success: true,
              message: "Dados obtidos com sucesso (sem campanhas)",
              meta: {
                totalSpent: 0,
                dailyBudget: 0,
                dateRange,
                campaigns: []
              }
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
        
        // Agora, buscar insights separadamente - implementar paginação
        let allInsights = [];
        let insightsUrl = `https://graph.facebook.com/v20.0/act_${metaAccountId}/insights?fields=campaign_id,spend&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}&level=campaign&access_token=${accessToken}&limit=500`;
        
        console.log("Buscando insights com paginação...");
        
        // Loop para paginação dos insights
        while (insightsUrl) {
          console.log("Chamando próxima página de insights:", insightsUrl.substring(0, 100) + "...");
          
          const insightsResponse = await fetch(insightsUrl);
          const insightsData = await insightsResponse.json();
          
          if (insightsData.error) {
            console.error("Erro na API Meta (insights):", insightsData.error);
            throw new Error(`Erro na API Meta (insights): ${insightsData.error.message || JSON.stringify(insightsData.error)}`);
          }
          
          // Adicionar os insights desta página ao resultado
          if (insightsData.data && insightsData.data.length > 0) {
            allInsights = [...allInsights, ...insightsData.data];
            console.log(`Adicionados ${insightsData.data.length} insights. Total agora: ${allInsights.length}`);
          }
          
          // Verificar se há mais páginas
          if (insightsData.paging && insightsData.paging.next) {
            insightsUrl = insightsData.paging.next;
          } else {
            insightsUrl = null;
          }
        }
        
        console.log(`Total de insights obtidos: ${allInsights.length}`);
        
        // Processar campanhas e combinar com insights
        const processedCampaigns = campaigns.map((campaign) => {
          // Encontrar insights para esta campanha
          const campaignInsights = allInsights.filter(insight => insight.campaign_id === campaign.id);
          
          // Calcular total gasto para a campanha
          let spend = 0;
          campaignInsights.forEach(insight => {
            const insightSpend = parseFloat(insight.spend || "0");
            if (!isNaN(insightSpend)) {
              spend += insightSpend;
            }
          });
          
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend: spend
          };
        });
        
        // Calcular o total gasto
        const totalSpent = processedCampaigns.reduce((total, campaign) => {
          return total + (parseFloat(campaign.spend) || 0);
        }, 0);
        
        console.log(`Total gasto calculado a partir de todas as campanhas: ${totalSpent}`);
        
        // Calcular orçamento diário (valor aproximado baseado no total gasto)
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const estimatedDailyBudget = parseFloat((totalSpent / daysDiff).toFixed(2));
        
        console.log(`Total gasto: ${totalSpent}, Orçamento diário estimado: ${estimatedDailyBudget}, Período de ${daysDiff} dias`);
        
        // Montar resposta
        const result = {
          success: true,
          message: "Dados obtidos com sucesso",
          meta_total_spent: totalSpent, // Importante: Incluir este campo para o cliente usar
          meta_daily_budget_current: estimatedDailyBudget, // Importante: Incluir este campo para o cliente usar
          meta: {
            totalSpent: totalSpent,
            dailyBudget: estimatedDailyBudget,
            dateRange: dateRange,
            campaigns: processedCampaigns,
            // Incluir dados de debug se solicitado
            debug: reqBody.debug ? {
              rawInsightsCount: allInsights.length,
              rawCampaignsCount: campaigns.length,
              daysDiff: daysDiff
            } : undefined
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
