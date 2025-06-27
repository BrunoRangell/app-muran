
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

    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    
    if (!metaAccessToken) {
      console.error("META_ACCESS_TOKEN não configurado");
      return new Response(
        JSON.stringify({ error: "Token de acesso não configurado" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔍 Buscando informações da conta Meta: act_${accountId}`);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/act_${accountId}?fields=name,account_id&access_token=${metaAccessToken}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro da API Meta (${response.status}):`, errorText);
      throw new Error(`Erro da API Meta: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ Dados da conta Meta obtidos:`, data);

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Erro na função meta-account-info:", error);
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
