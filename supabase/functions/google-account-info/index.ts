
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId } = await req.json();
    
    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "accountId é obrigatório" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente Supabase para buscar tokens
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar tokens Google Ads da tabela api_tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('api_tokens')
      .select('name, value')
      .in('name', ['google_ads_access_token', 'google_ads_manager_id', 'google_ads_developer_token']);

    if (tokensError || !tokens || tokens.length === 0) {
      console.error("Erro ao buscar tokens Google Ads:", tokensError);
      return new Response(
        JSON.stringify({ error: "Tokens Google Ads não encontrados no banco de dados" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Organizar tokens
    const tokenMap = tokens.reduce((acc, token) => {
      acc[token.name] = token.value;
      return acc;
    }, {} as Record<string, string>);

    const googleAccessToken = tokenMap['google_ads_access_token'];
    const googleCustomerId = tokenMap['google_ads_manager_id'];
    const googleDeveloperToken = tokenMap['google_ads_developer_token'];
    
    if (!googleAccessToken || !googleCustomerId || !googleDeveloperToken) {
      console.error("Tokens Google Ads incompletos");
      return new Response(
        JSON.stringify({ error: "Tokens de acesso Google Ads não configurados completamente" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔍 Buscando informações da conta Google: ${accountId}`);
    
    const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name
      FROM
        customer_client
      WHERE
        customer_client.manager = FALSE
        AND customer_client.id = ${accountId}
    `;

    const response = await fetch(
      `https://googleads.googleapis.com/v21/customers/${googleCustomerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
          'developer-token': googleDeveloperToken,
        },
        body: JSON.stringify({ query })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro da API Google (${response.status}):`, errorText);
      throw new Error(`Erro da API Google: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ Dados da conta Google obtidos:`, data);

    // Extrair informações do primeiro resultado
    if (data.results && data.results.length > 0) {
      const customerClient = data.results[0].customerClient;
      const accountInfo = {
        id: customerClient.id,
        descriptiveName: customerClient.descriptiveName
      };
      
      return new Response(
        JSON.stringify(accountInfo),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Conta não encontrada" }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error("Erro na função google-account-info:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
