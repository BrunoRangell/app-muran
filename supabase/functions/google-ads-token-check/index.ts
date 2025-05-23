
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log("Função de verificação de token iniciando...");

serve(async (req) => {
  // Tratar chamadas OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter tokens do Google Ads da tabela api_tokens
    const { data: tokensData, error: tokensError } = await supabase
      .from("api_tokens")
      .select("name, value")
      .or('name.eq.google_ads_access_token,name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
    
    if (tokensError) {
      console.error("Erro ao buscar tokens:", tokensError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro ao buscar tokens", 
          details: tokensError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const tokens: Record<string, string> = {};
    tokensData?.forEach(token => {
      tokens[token.name] = token.value;
    });
    
    if (!tokens.google_ads_access_token || !tokens.google_ads_developer_token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Tokens incompletos", 
          details: "Token de acesso ou token de desenvolvedor não encontrados"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Configurar headers para a API do Google Ads
    const headers = {
      'Content-Type': 'application/json',
      'developer-token': tokens.google_ads_developer_token,
      'Authorization': `Bearer ${tokens.google_ads_access_token}`
    };

    if (tokens.google_ads_manager_id) {
      headers['login-customer-id'] = tokens.google_ads_manager_id;
    }
    
    // Fazer uma consulta simples para verificar se o token está funcionando
    // Usamos a conta gerenciadora para esta verificação
    const managerCustomerId = tokens.google_ads_manager_id;
    const simpleQuery = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name
      FROM
        customer_client
      LIMIT 1
    `;
    
    console.log("Tentando verificar token com a API do Google Ads...");
    
    // Fazer chamada para a API do Google Ads
    const response = await fetch(
      `https://googleads.googleapis.com/v18/customers/${managerCustomerId}/googleAds:search`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query: simpleQuery })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erro na resposta da API:", errorData);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Token inválido", 
          status: response.status,
          statusText: response.statusText,
          details: errorData
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const data = await response.json();
    
    // Se chegamos aqui, o token está válido
    console.log("Token verificado com sucesso!");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Token válido",
        expiry: null, // Não temos essa informação diretamente
        sampleData: data.results?.length > 0 ? data.results[0] : null
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Erro ao verificar token:", error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erro ao verificar token", 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
