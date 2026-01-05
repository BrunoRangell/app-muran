import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o token atual do banco
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .single();

    if (tokenError || !tokenData?.value) {
      console.error('Erro ao buscar token:', tokenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token não encontrado no banco' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const currentToken = tokenData.value;
    console.log('Verificando token atual...');

    // Validar o token para verificar se é curto ou longo
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${currentToken}&access_token=${currentToken}`;
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();

    console.log('Debug do token:', JSON.stringify(debugData, null, 2));

    if (debugData.error) {
      console.error('Token inválido:', debugData.error);
      
      await supabase
        .from('meta_token_metadata')
        .update({
          status: 'invalid',
          last_checked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          details: { error: debugData.error }
        })
        .eq('token_type', 'access_token');

      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido', details: debugData.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const tokenInfo = debugData.data;
    const expiresAt = tokenInfo.expires_at ? new Date(tokenInfo.expires_at * 1000) : null;
    const now = new Date();

    // Verificar se já é um token de longa duração (expira em mais de 24 horas)
    if (expiresAt) {
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilExpiry > 24) {
        console.log('Token já é de longa duração. Expira em:', expiresAt.toISOString());
        
        // Atualizar metadata
        await supabase
          .from('meta_token_metadata')
          .update({
            status: 'active',
            expires_at: expiresAt.toISOString(),
            last_checked: now.toISOString(),
            updated_at: now.toISOString(),
            details: { token_type: 'long_lived', scopes: tokenInfo.scopes }
          })
          .eq('token_type', 'access_token');

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Token já é de longa duração',
            expires_at: expiresAt.toISOString(),
            days_until_expiry: Math.floor(hoursUntilExpiry / 24)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Token é curto, converter para longo
    console.log('Token curto detectado. Convertendo para longa duração...');

    if (!metaAppSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'META_APP_SECRET não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const appId = tokenInfo.app_id;
    const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${metaAppSecret}&fb_exchange_token=${currentToken}`;
    
    const exchangeResponse = await fetch(exchangeUrl);
    const exchangeData = await exchangeResponse.json();

    console.log('Resposta da conversão:', JSON.stringify(exchangeData, null, 2));

    if (exchangeData.error) {
      console.error('Erro na conversão:', exchangeData.error);
      
      await supabase.from('system_logs').insert({
        event_type: 'meta_token_conversion_error',
        message: 'Falha ao converter token',
        details: { error: exchangeData.error }
      });

      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao converter token', details: exchangeData.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const longLivedToken = exchangeData.access_token;
    const expiresIn = exchangeData.expires_in;

    // Validar novo token
    const newDebugUrl = `https://graph.facebook.com/debug_token?input_token=${longLivedToken}&access_token=${longLivedToken}`;
    const newDebugResponse = await fetch(newDebugUrl);
    const newDebugData = await newDebugResponse.json();

    let newExpiresAt: Date;
    if (newDebugData.data?.expires_at) {
      newExpiresAt = new Date(newDebugData.data.expires_at * 1000);
    } else if (expiresIn) {
      newExpiresAt = new Date(Date.now() + expiresIn * 1000);
    } else {
      newExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    }

    // Salvar token longo
    await supabase
      .from('api_tokens')
      .update({ value: longLivedToken, updated_at: new Date().toISOString() })
      .eq('name', 'meta_access_token');

    // Atualizar metadata
    await supabase
      .from('meta_token_metadata')
      .update({
        status: 'active',
        expires_at: newExpiresAt.toISOString(),
        last_checked: now.toISOString(),
        last_renewed: now.toISOString(),
        updated_at: now.toISOString(),
        details: { token_type: 'long_lived', converted_at: now.toISOString(), scopes: newDebugData.data?.scopes }
      })
      .eq('token_type', 'access_token');

    // Log sucesso
    await supabase.from('system_logs').insert({
      event_type: 'meta_token_converted',
      message: 'Token curto convertido para longa duração',
      details: { expires_at: newExpiresAt.toISOString(), days_until_expiry: Math.floor((newExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) }
    });

    console.log('Token convertido com sucesso! Expira em:', newExpiresAt.toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token convertido para longa duração',
        expires_at: newExpiresAt.toISOString(),
        days_until_expiry: Math.floor((newExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro inesperado:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
