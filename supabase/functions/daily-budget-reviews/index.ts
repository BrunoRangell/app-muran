
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

// Configurações CORS para permitir chamadas do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log('Recebida requisição OPTIONS (CORS preflight)');
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log('Função daily-budget-reviews iniciada');
    const payload = await req.json();
    console.log('Payload recebido:', JSON.stringify(payload, null, 2));

    // Verificando o formato do payload
    if (!payload || !payload.method) {
      console.error('Payload inválido ou método não especificado');
      return new Response(
        JSON.stringify({ error: 'Payload inválido ou método não especificado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Extrair e validar parâmetros
    const { method, clientId, reviewDate, accessToken } = payload;
    
    if (method !== 'getMetaAdsData') {
      console.error(`Método não suportado: ${method}`);
      return new Response(
        JSON.stringify({ error: `Método não suportado: ${method}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!clientId || !reviewDate || !accessToken) {
      console.error('Parâmetros obrigatórios não fornecidos');
      return new Response(
        JSON.stringify({ 
          error: 'Parâmetros incompletos',
          missingParams: {
            clientId: !clientId,
            reviewDate: !reviewDate,
            accessToken: !accessToken
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Configurar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Buscar informações do cliente para obter o ID da conta Meta
    console.log(`Buscando informações do cliente: ${clientId}`);
    const { data: clientData, error: clientError } = await supabaseClient
      .from('clients')
      .select('name, meta_account_id, meta_account_name')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error('Erro ao buscar informações do cliente:', clientError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado', details: clientError }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    if (!clientData.meta_account_id) {
      console.error('Cliente não possui ID de conta Meta configurado');
      return new Response(
        JSON.stringify({ error: 'Cliente não possui ID de conta Meta configurado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Simulação temporária de dados da Meta Ads para teste
    console.log('Gerando dados simulados para teste');
    const simulatedData = {
      client: {
        id: clientId,
        name: clientData.name,
        meta_account_id: clientData.meta_account_id,
        meta_account_name: clientData.meta_account_name
      },
      reviewDate,
      metaData: {
        dailyBudget: Math.floor(Math.random() * 50000) / 100,
        spent: Math.floor(Math.random() * 30000) / 100,
        idealBudget: Math.floor(Math.random() * 60000) / 100,
        recommendation: Math.random() > 0.5 ? 'increase' : (Math.random() > 0.5 ? 'decrease' : 'maintain'),
        budgetChange: Math.floor(Math.random() * 2000 - 1000) / 100,
      }
    };

    // Inserir os dados no banco
    try {
      console.log('Inserindo registro de revisão de orçamento diário no banco');
      const { data: reviewData, error: reviewError } = await supabaseClient
        .rpc('insert_daily_budget_review', {
          p_client_id: clientId,
          p_review_date: reviewDate,
          p_meta_daily_budget_current: simulatedData.metaData.dailyBudget,
          p_meta_total_spent: simulatedData.metaData.spent,
          p_meta_account_id: clientData.meta_account_id,
          p_meta_account_name: clientData.meta_account_name || 'Meta Ads'
        });

      if (reviewError) {
        console.error('Erro ao inserir registro de revisão:', reviewError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao salvar revisão no banco',
            details: reviewError
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('Registro inserido com sucesso, ID:', reviewData);
      simulatedData.reviewId = reviewData;
    } catch (dbError) {
      console.error('Exceção ao inserir no banco:', dbError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro interno ao salvar dados', 
          details: dbError instanceof Error ? dbError.message : String(dbError)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('Retornando dados simulados:', JSON.stringify(simulatedData, null, 2));
    return new Response(
      JSON.stringify(simulatedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro não tratado na função Edge:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})
