import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId, since } = await req.json();
    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'accountId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .single();

    if (tokenError || !tokenData?.value) {
      console.error('Erro ao buscar token Meta Ads:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token Meta Ads não encontrado no banco de dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.value;
    const until = new Date().toISOString().split('T')[0];
    const timeRange = encodeURIComponent(JSON.stringify({ since, until }));

    const response = await fetch(`https://graph.facebook.com/v18.0/act_${accountId}/insights?time_range=${timeRange}&fields=spend&access_token=${accessToken}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('Erro da API Meta:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Erro da API Meta' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro na função meta-account-spend:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
