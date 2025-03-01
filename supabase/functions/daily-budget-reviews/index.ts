
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Tratamento de CORS para requisições OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Criar client do Supabase usando variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extrair o corpo da requisição
    const requestData = await req.json();
    const { method } = requestData;
    
    console.log('Método requisitado:', method);
    
    // Métodos de diagnóstico
    if (method === 'ping') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Função Edge está online!',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Método principal para obter dados do Meta Ads
    if (method === 'getMetaAdsData') {
      const { 
        clientId, 
        reviewDate, 
        accessToken, 
        clientName, 
        metaAccountId,
        dateRange,
        debug = false
      } = requestData;
      
      // Validar parâmetros necessários
      if (!clientId || !reviewDate || !accessToken || !metaAccountId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Parâmetros obrigatórios não fornecidos',
            missingParams: {
              clientId: !clientId,
              reviewDate: !reviewDate,
              accessToken: !accessToken,
              metaAccountId: !metaAccountId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      console.log(`Processando requisição para cliente ${clientName || clientId}, conta ${metaAccountId}`);
      
      try {
        // Configurar período para as consultas
        const startDate = dateRange?.start || reviewDate;
        const endDate = dateRange?.end || reviewDate;
        
        console.log(`Período: ${startDate} a ${endDate}`);
        
        // Buscar campanhas da conta Meta Ads
        const campaignsUrl = `https://graph.facebook.com/v20.0/act_${metaAccountId}/campaigns`;
        const campaignsParams = new URLSearchParams({
          access_token: accessToken,
          fields: 'name,status,spend,objective,daily_budget',
          limit: '250'
        });
        
        console.log('Consultando API do Meta para campanhas...');
        const campaignsResponse = await fetch(`${campaignsUrl}?${campaignsParams.toString()}`);
        const campaignsData = await campaignsResponse.json();
        
        // Verificar erro na resposta da API do Meta
        if (campaignsData.error) {
          console.error('Erro na API do Meta:', campaignsData.error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Erro na API do Meta: ${campaignsData.error.message}`,
              error: campaignsData.error,
              meta: { dateRange: { start: startDate, end: endDate } }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        // Processar campanhas
        const campaigns = campaignsData.data || [];
        console.log(`Encontradas ${campaigns.length} campanhas`);
        
        // Calcular orçamento diário total
        let totalDailyBudget = 0;
        let totalSpent = 0;
        
        const processedCampaigns = campaigns.map(campaign => {
          // Converter valores para formato numérico
          const spend = parseFloat(campaign.spend || '0');
          const dailyBudget = parseFloat(campaign.daily_budget || '0') / 100; // Meta retorna em centavos
          
          // Atualizar totais
          totalDailyBudget += dailyBudget;
          totalSpent += spend;
          
          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend: spend,
            daily_budget: dailyBudget,
            objective: campaign.objective
          };
        });
        
        // Preparar resposta de sucesso
        const result = {
          success: true,
          message: 'Dados do Meta Ads obtidos com sucesso',
          client: {
            id: clientId,
            company_name: clientName,
            meta_account_id: metaAccountId
          },
          meta: {
            totalSpent: totalSpent,
            dailyBudget: totalDailyBudget,
            dateRange: {
              start: startDate,
              end: endDate
            },
            campaigns: processedCampaigns
          }
        };
        
        // Adicionar dados extras para debug se solicitado
        if (debug) {
          result.debug = {
            timestamp: new Date().toISOString(),
            campaignsRawResponse: debug ? campaignsData : undefined,
            apiDetails: {
              url: campaignsUrl,
              params: campaignsParams.toString().replace(accessToken, '***TOKEN***')
            }
          };
        }
        
        // Salvar os dados no Supabase para histórico (opcional)
        try {
          const { data, error } = await supabase.rpc('insert_daily_budget_review', {
            p_client_id: clientId,
            p_review_date: reviewDate,
            p_meta_daily_budget_current: totalDailyBudget,
            p_meta_total_spent: totalSpent,
            p_meta_account_id: metaAccountId,
            p_meta_account_name: clientName || 'Nome não informado'
          });
          
          if (error) {
            console.error('Erro ao salvar no banco:', error);
            // Não interromper o fluxo, apenas logar o erro
          } else {
            console.log('Dados salvos no banco com ID:', data);
            result.reviewId = data;
          }
        } catch (dbError) {
          console.error('Exceção ao salvar no banco:', dbError);
          // Não interromper o fluxo, apenas logar o erro
        }
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
        
      } catch (metaApiError) {
        console.error('Erro ao processar dados do Meta:', metaApiError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Erro ao processar dados do Meta: ${metaApiError.message}`,
            error: {
              message: metaApiError.message,
              stack: metaApiError.stack
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }
    
    // Se o método não for reconhecido
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Método '${method}' não reconhecido` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
    
  } catch (error) {
    console.error('Erro geral na função Edge:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erro interno do servidor: ${error.message}`,
        error: {
          message: error.message,
          stack: error.stack
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
