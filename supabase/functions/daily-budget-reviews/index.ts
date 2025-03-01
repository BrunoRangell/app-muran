
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configuração de CORS para permitir solicitações de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para responder com erro em formato padronizado
function respondWithError(message: string, details?: any, status = 200) {
  console.error(`Erro: ${message}`, details);
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: details || { message }
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Função para responder com sucesso
function respondWithSuccess(data: any) {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Função principal que lida com as requisições
serve(async (req) => {
  // Tratar requisições preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extrair o corpo da requisição com tratamento seguro
    let reqBody;
    try {
      const bodyText = await req.text();
      
      // Verificar se o corpo não está vazio
      if (!bodyText || bodyText.trim() === '') {
        return respondWithError('Corpo da requisição vazio');
      }
      
      // Tentar fazer o parse do JSON
      try {
        reqBody = JSON.parse(bodyText);
      } catch (parseError) {
        console.error('Erro ao analisar JSON:', parseError);
        console.log('Texto recebido:', bodyText);
        return respondWithError(
          'Formato de JSON inválido no corpo da requisição', 
          { 
            parseError: parseError.message,
            receivedBody: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')
          }
        );
      }
    } catch (bodyError) {
      return respondWithError('Erro ao ler corpo da requisição', bodyError);
    }

    // Verificar método solicitado
    const method = reqBody?.method;
    
    // Método de ping para verificar se a função está online
    if (method === 'ping') {
      return respondWithSuccess({
        message: 'Função Edge está online',
        timestamp: new Date().toISOString()
      });
    }
    
    // Método para obter dados do Meta Ads
    if (method === 'getMetaAdsData') {
      // Validar parâmetros obrigatórios
      if (!reqBody.accessToken) {
        return respondWithError('Token de acesso do Meta Ads não fornecido');
      }
      
      if (!reqBody.metaAccountId) {
        return respondWithError('ID da conta do Meta Ads não fornecido');
      }
      
      // Configurar datas e parâmetros
      const metaAccountId = reqBody.metaAccountId;
      const accessToken = reqBody.accessToken;
      const clientName = reqBody.clientName || 'Cliente';
      const dateRange = reqBody.dateRange || {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      };
      
      console.log(`Buscando dados do Meta Ads para conta: ${metaAccountId}`);
      console.log(`Período: ${dateRange.start} a ${dateRange.end}`);
      
      try {
        // Consultar a API do Meta Ads para obter dados de campanhas
        const campaignsUrl = `https://graph.facebook.com/v20.0/act_${metaAccountId}/campaigns`;
        const campaignsParams = new URLSearchParams({
          access_token: accessToken,
          fields: 'name,status,objective,spend,daily_budget,lifetime_budget,budget_remaining,insights.time_range({"since":"${dateRange.start}","until":"${dateRange.end}"}){spend}'
        });
        
        console.log(`Fazendo requisição para: ${campaignsUrl}`);
        
        const campaignsResponse = await fetch(`${campaignsUrl}?${campaignsParams.toString()}`);
        const campaignsData = await campaignsResponse.json();
        
        console.log("Resposta da API Meta (preview):", JSON.stringify(campaignsData).substring(0, 200));
        
        // Verificar erro na resposta da API
        if (campaignsData.error) {
          return respondWithError(
            `Erro na API do Meta Ads: ${campaignsData.error.message}`, 
            campaignsData.error
          );
        }
        
        // Processar dados para o formato esperado pelo frontend
        const campaigns = campaignsData.data || [];
        
        // Calcular gastos totais
        let totalSpent = 0;
        let dailyBudgetTotal = 0;
        
        campaigns.forEach((campaign: any) => {
          // Calcular gasto da campanha
          const spend = parseFloat(campaign.spend || '0');
          if (!isNaN(spend)) {
            totalSpent += spend;
          }
          
          // Calcular orçamento diário
          const dailyBudget = parseFloat(campaign.daily_budget || '0') / 100; // Meta devolve em centavos
          if (!isNaN(dailyBudget) && campaign.status === 'ACTIVE') {
            dailyBudgetTotal += dailyBudget;
          }
        });
        
        // Formatar resposta
        const response = {
          meta: {
            totalSpent,
            dailyBudget: dailyBudgetTotal,
            dateRange,
            campaigns: campaigns.map((campaign: any) => ({
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              spend: parseFloat(campaign.spend || '0')
            }))
          },
          client: {
            id: reqBody.clientId,
            company_name: clientName,
            meta_account_id: metaAccountId
          },
          success: true,
          message: "Dados obtidos com sucesso"
        };
        
        return respondWithSuccess(response);
        
      } catch (apiError) {
        console.error("Erro ao acessar API do Meta:", apiError);
        return respondWithError(
          'Falha ao acessar a API do Meta Ads', 
          {
            message: apiError.message,
            stack: apiError.stack
          }
        );
      }
    }
    
    // Método não reconhecido
    return respondWithError(`Método não suportado: ${method}`);
    
  } catch (error) {
    console.error("Erro interno na função Edge:", error);
    return respondWithError(
      'Erro interno do servidor', 
      {
        message: error.message,
        stack: error.stack
      }
    );
  }
});
