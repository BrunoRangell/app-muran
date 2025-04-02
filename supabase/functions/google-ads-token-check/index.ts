
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleAdsToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar cliente do Supabase usando variáveis de ambiente
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: tokensData, error: tokensError } = await supabaseClient
      .from('api_tokens')
      .select('name, value')
      .or('name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret');

    if (tokensError) {
      console.error("Erro ao buscar tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Falha ao buscar tokens do banco de dados", details: tokensError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Extrair tokens do resultado
    const tokens: Record<string, string> = {};
    tokensData?.forEach(token => {
      tokens[token.name] = token.value;
    });

    // Verificar se temos todos os tokens necessários
    if (!tokens.google_ads_refresh_token || !tokens.google_ads_client_id || !tokens.google_ads_client_secret) {
      return new Response(
        JSON.stringify({ 
          error: "Tokens incompletos", 
          details: "Refresh token, client ID ou client secret não encontrados" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Renovar o token de acesso usando refresh token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      client_id: tokens.google_ads_client_id,
      client_secret: tokens.google_ads_client_secret,
      refresh_token: tokens.google_ads_refresh_token,
      grant_type: 'refresh_token'
    });

    console.log("Enviando requisição para renovar token...");
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Erro na resposta da API do Google:", errorData);
      
      // Registrar o erro no banco de dados
      await supabaseClient.from('google_ads_token_metadata').insert({
        token_type: 'access_token',
        status: 'error',
        details: { error: errorData, timestamp: new Date().toISOString() }
      });

      return new Response(
        JSON.stringify({ error: "Falha ao renovar token", details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const tokenData: GoogleAdsToken = await tokenResponse.json();
    console.log("Token renovado com sucesso");

    // Atualizar o token de acesso no banco de dados
    const { error: updateError } = await supabaseClient
      .from('api_tokens')
      .update({ value: tokenData.access_token })
      .eq('name', 'google_ads_access_token');

    if (updateError) {
      console.error("Erro ao atualizar token de acesso:", updateError);
      return new Response(
        JSON.stringify({ error: "Falha ao salvar token renovado", details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Atualizar os metadados do token
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    await supabaseClient.from('google_ads_token_metadata').insert({
      token_type: 'access_token',
      status: 'valid',
      expires_at: expiresAt.toISOString(),
      details: {
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in
      }
    });

    // Verificar se podemos acessar a API do Google Ads
    const { data: managerIdData, error: managerIdError } = await supabaseClient
      .from('api_tokens')
      .select('value')
      .eq('name', 'google_ads_manager_id')
      .single();

    if (managerIdError || !managerIdData) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          tokenRefreshed: true, 
          apiAccess: false,
          message: "Token renovado, mas ID da conta gerenciadora não encontrado" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: developerTokenData, error: developerTokenError } = await supabaseClient
      .from('api_tokens')
      .select('value')
      .eq('name', 'google_ads_developer_token')
      .single();

    if (developerTokenError || !developerTokenData) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          tokenRefreshed: true, 
          apiAccess: false,
          message: "Token renovado, mas developer token não encontrado" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Testar acesso à API do Google Ads
    const managerId = managerIdData.value;
    const developerToken = developerTokenData.value;
    
    try {
      const testResponse = await fetch(
        `https://googleads.googleapis.com/v18/customers/${managerId}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `
              SELECT
                  customer_client.id,
                  customer_client.descriptive_name
              FROM
                  customer_client
              LIMIT 10
            `
          })
        }
      );

      if (!testResponse.ok) {
        const apiError = await testResponse.text();
        console.error("Erro ao testar API Google Ads:", apiError);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            tokenRefreshed: true, 
            apiAccess: false,
            apiError: apiError
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const apiData = await testResponse.json();
      const clientsCount = apiData.results ? apiData.results.length : 0;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          tokenRefreshed: true, 
          apiAccess: true,
          clientsCount: clientsCount,
          message: `Token renovado e API acessível. ${clientsCount} clientes encontrados.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      console.error("Erro ao testar API Google Ads:", apiError);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          tokenRefreshed: true, 
          apiAccess: false,
          error: String(apiError)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error("Erro geral na função:", err);
    
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
