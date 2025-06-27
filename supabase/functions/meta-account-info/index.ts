
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

    // Criar cliente Supabase para buscar token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar token Meta Ads da tabela api_tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .single();

    if (tokenError || !tokenData?.value) {
      console.error("Erro ao buscar token Meta Ads:", tokenError);
      return new Response(
        JSON.stringify({ error: "Token Meta Ads não encontrado no banco de dados" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const metaAccessToken = tokenData.value;
    
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
