
// Importar módulos necessários
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsPreflightRequest, createCorsResponse, createErrorResponse } from "../_shared/cors.ts";

// Função principal que processa todas as requisições
serve(async (req) => {
  // Log para diagnóstico
  console.log(`Função Edge "daily-budget-reviews" recebeu requisição ${req.method}`);
  
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log("Respondendo a requisição CORS preflight");
    return handleCorsPreflightRequest();
  }
  
  try {
    // Verificar se a requisição tem um corpo válido
    let requestData;
    try {
      requestData = await req.json();
      console.log("Payload recebido:", JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.error("Erro ao analisar o corpo da requisição:", parseError);
      return createErrorResponse("Corpo da requisição inválido. Esperava um JSON válido.", 400);
    }
    
    // Verificar se o método foi especificado
    if (!requestData.method) {
      console.error("Método não especificado na requisição");
      return createErrorResponse("Parâmetro 'method' é obrigatório", 400);
    }
    
    // Tratar ping para verificar se a função está ativa
    if (requestData.method === "ping") {
      console.log("Teste de ping recebido, respondendo com sucesso");
      return createCorsResponse({
        success: true,
        message: "Função Edge está respondendo corretamente",
        timestamp: new Date().toISOString(),
        version: "1.1.0" // Versionar a função Edge para diagnóstico
      });
    }
    
    // Tratar solicitação de dados do Meta Ads
    if (requestData.method === "getMetaAdsData") {
      // Verificar campos obrigatórios
      const requiredFields = ["clientId", "accessToken"];
      for (const field of requiredFields) {
        if (!requestData[field]) {
          console.error(`Campo obrigatório ausente: ${field}`);
          return createErrorResponse(`Campo obrigatório ausente: ${field}`, 400);
        }
      }
      
      console.log(`Processando solicitação de dados do Meta Ads para cliente: ${requestData.clientId}`);
      
      // Validar token de acesso rápido
      if (!requestData.accessToken || requestData.accessToken.length < 20) {
        console.error("Token de acesso Meta Ads inválido ou muito curto");
        return createErrorResponse("Token de acesso Meta Ads inválido", 400);
      }
      
      // Validar se a conta Meta está configurada
      if (!requestData.metaAccountId) {
        console.error("ID da conta Meta Ads não fornecido");
        return createErrorResponse("ID da conta Meta Ads não configurado para este cliente", 400);
      }
      
      try {
        // Preparar datas para a consulta
        const today = new Date();
        
        // Caso tenha sido fornecido um intervalo de datas, usá-lo
        let startDate, endDate;
        
        if (requestData.dateRange && requestData.dateRange.start && requestData.dateRange.end) {
          startDate = new Date(requestData.dateRange.start);
          endDate = new Date(requestData.dateRange.end);
          console.log(`Usando intervalo de datas fornecido: ${startDate.toISOString()} a ${endDate.toISOString()}`);
        } else {
          // Caso contrário, usar o mês atual
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          // Primeiro dia do mês atual
          startDate = new Date(currentYear, currentMonth, 1);
          // Último dia do mês atual
          endDate = new Date(currentYear, currentMonth + 1, 0);
          console.log(`Usando mês atual: ${startDate.toISOString()} a ${endDate.toISOString()}`);
        }
        
        // Formatar datas para YYYY-MM-DD
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];
        
        console.log(`Consultando Meta Ads para conta ID: ${requestData.metaAccountId}`);
        
        // Construir URL para a API do Meta Ads
        const metaUrl = `https://graph.facebook.com/v20.0/act_${requestData.metaAccountId}/campaigns`;
        
        // Campos a serem solicitados à API do Meta Ads
        const fields = 'name,status,daily_budget,lifetime_budget,effective_status,spend,insights{spend}';
        
        // Parâmetros adicionais
        const params = new URLSearchParams({
          access_token: requestData.accessToken,
          fields,
          time_range: JSON.stringify({
            since: formattedStartDate,
            until: formattedEndDate
          }),
          limit: '1000' // Limite alto para garantir que todas as campanhas sejam retornadas
        });
        
        console.log(`Enviando requisição para API Meta Ads: ${metaUrl}`);
        
        // Chamada à API do Meta Ads
        const metaResponse = await fetch(`${metaUrl}?${params.toString()}`);
        
        // Verificar resposta da API
        if (!metaResponse.ok) {
          const errorText = await metaResponse.text();
          console.error(`Erro na API do Meta Ads: ${metaResponse.status} - ${errorText}`);
          
          let errorMessage = `A API do Meta Ads retornou um erro ${metaResponse.status}`;
          let errorDetails = errorText;
          
          try {
            // Tentar analisar o erro como JSON
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              if (errorJson.error.code === 190) {
                errorMessage = "Token de acesso do Meta Ads expirado ou inválido";
              } else if (errorJson.error.code === 100) {
                errorMessage = "ID da conta Meta Ads inválido ou sem permissão";
              } else {
                errorMessage = errorJson.error.message || errorMessage;
              }
              errorDetails = errorJson.error;
            }
          } catch (e) {
            // Se não for JSON, usar o texto bruto
            console.log("Resposta de erro não é um JSON válido");
          }
          
          return createErrorResponse(errorMessage, 400, errorDetails);
        }
        
        // Processar resposta da API
        const metaData = await metaResponse.json();
        console.log(`Dados recebidos da API Meta Ads: ${metaData.data?.length || 0} campanhas`);
        
        // Verificar se há dados
        if (!metaData.data || metaData.data.length === 0) {
          console.log("Nenhuma campanha encontrada para a conta");
          return createCorsResponse({
            success: true,
            message: "Nenhuma campanha encontrada para a conta Meta Ads",
            meta: {
              totalSpent: 0,
              dailyBudget: 0,
              dateRange: {
                start: formattedStartDate,
                end: formattedEndDate
              },
              campaigns: []
            }
          });
        }
        
        // Processar campanhas e calcular gastos
        let totalSpent = 0;
        let totalBudget = 0;
        const campaigns = [];
        
        for (const campaign of metaData.data) {
          let campaignSpend = 0;
          
          // Extrair gasto da campanha
          if (campaign.spend) {
            campaignSpend = parseFloat(campaign.spend);
          } else if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
            campaignSpend = parseFloat(campaign.insights.data[0].spend || "0");
          }
          
          totalSpent += campaignSpend;
          
          // Extrair orçamento diário da campanha
          if (campaign.daily_budget) {
            totalBudget += parseFloat(campaign.daily_budget) / 100; // Meta Ads retorna em centavos
          }
          
          // Adicionar campanha processada à lista
          campaigns.push({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend: campaignSpend
          });
        }
        
        // Preparar resultado da análise
        const result = {
          success: true,
          message: "Dados do Meta Ads obtidos com sucesso",
          meta_total_spent: totalSpent,
          meta_daily_budget_current: totalBudget,
          client: {
            id: requestData.clientId,
            company_name: requestData.clientName || "Cliente",
            meta_account_id: requestData.metaAccountId
          },
          meta: {
            totalSpent: totalSpent,
            dailyBudget: totalBudget,
            dateRange: {
              start: formattedStartDate,
              end: formattedEndDate
            },
            campaigns: campaigns
          }
        };
        
        console.log("Análise concluída com sucesso");
        return createCorsResponse(result);
        
      } catch (apiError) {
        console.error("Erro ao acessar a API do Meta Ads:", apiError);
        return createErrorResponse("Erro ao acessar a API do Meta Ads: " + (apiError.message || "Erro desconhecido"), 500);
      }
    }
    
    // Método desconhecido
    console.error(`Método desconhecido: ${requestData.method}`);
    return createErrorResponse(`Método não suportado: ${requestData.method}`, 400);
    
  } catch (error) {
    console.error("Erro não tratado na função Edge:", error);
    return createErrorResponse("Erro interno na função Edge: " + (error.message || "Erro desconhecido"), 500);
  }
});
