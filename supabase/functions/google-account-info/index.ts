
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const googleAccessToken = Deno.env.get('GOOGLE_ACCESS_TOKEN');
    const googleCustomerId = Deno.env.get('GOOGLE_CUSTOMER_ID');
    
    if (!googleAccessToken || !googleCustomerId) {
      console.error("GOOGLE_ACCESS_TOKEN ou GOOGLE_CUSTOMER_ID não configurados");
      return new Response(
        JSON.stringify({ error: "Tokens de acesso não configurados" }), 
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
      `https://googleads.googleapis.com/v14/customers/${googleCustomerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
          'developer-token': Deno.env.get('GOOGLE_DEVELOPER_TOKEN') || '',
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
