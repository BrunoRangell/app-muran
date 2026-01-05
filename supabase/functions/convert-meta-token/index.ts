import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter o token curto do corpo da requisição ou do banco
    const body = await req.json().catch(() => ({}));
    let shortLivedToken = body.short_lived_token;

    // Se não foi fornecido, buscar o token atual do banco (que pode ser o curto recém-inserido)
    if (!shortLivedToken) {
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
      shortLivedToken = tokenData.value;
    }

    console.log('Iniciando conversão de token curto para token longo...');

    // Primeiro, validar o token atual para obter informações
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${shortLivedToken}&access_token=${shortLivedToken}`;
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();

    console.log('Debug do token atual:', JSON.stringify(debugData, null, 2));

    if (debugData.error) {
      console.error('Token inválido:', debugData.error);
      
      // Atualizar metadata para refletir token inválido
      await supabase
        .from('meta_token_metadata')
        .update({
          status: 'invalid',
          last_checked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          details: { error: debugData.error, checked_at: new Date().toISOString() }
        })
        .eq('token_type', 'access_token');

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido ou expirado',
          details: debugData.error 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const tokenInfo = debugData.data;
    const appId = tokenInfo.app_id;

    // Verificar se temos o APP_SECRET configurado
    if (!metaAppSecret) {
      console.error('META_APP_SECRET não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'META_APP_SECRET não configurado nas variáveis de ambiente' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Converter para token de longa duração usando fb_exchange_token
    console.log('Convertendo para token de longa duração...');
    const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${metaAppSecret}&fb_exchange_token=${shortLivedToken}`;
    
    const exchangeResponse = await fetch(exchangeUrl);
    const exchangeData = await exchangeResponse.json();

    console.log('Resposta da conversão:', JSON.stringify(exchangeData, null, 2));

    if (exchangeData.error) {
      console.error('Erro na conversão do token:', exchangeData.error);
      
      // Log do erro
      await supabase.from('system_logs').insert({
        event_type: 'meta_token_conversion_error',
        message: 'Falha ao converter token curto para longo',
        details: { error: exchangeData.error, app_id: appId }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha ao converter token',
          details: exchangeData.error 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const longLivedToken = exchangeData.access_token;
    const expiresIn = exchangeData.expires_in; // em segundos

    // Validar o novo token longo para obter a data de expiração exata
    const newDebugUrl = `https://graph.facebook.com/debug_token?input_token=${longLivedToken}&access_token=${longLivedToken}`;
    const newDebugResponse = await fetch(newDebugUrl);
    const newDebugData = await newDebugResponse.json();

    console.log('Debug do novo token longo:', JSON.stringify(newDebugData, null, 2));

    let expiresAt: Date;
    if (newDebugData.data?.expires_at) {
      expiresAt = new Date(newDebugData.data.expires_at * 1000);
    } else if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    } else {
      // Default: 60 dias para tokens de longa duração
      expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    }

    // Salvar o novo token longo no banco
    const { error: updateError } = await supabase
      .from('api_tokens')
      .update({ 
        value: longLivedToken,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'meta_access_token');

    if (updateError) {
      console.error('Erro ao salvar token:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar token no banco' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Atualizar metadata com informações do token longo
    const { error: metadataError } = await supabase
      .from('meta_token_metadata')
      .update({
        status: 'active',
        expires_at: expiresAt.toISOString(),
        last_checked: new Date().toISOString(),
        last_renewed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        details: {
          token_type: 'long_lived',
          converted_at: new Date().toISOString(),
          original_expires_in: expiresIn,
          app_id: appId,
          user_id: newDebugData.data?.user_id,
          scopes: newDebugData.data?.scopes
        }
      })
      .eq('token_type', 'access_token');

    if (metadataError) {
      console.warn('Aviso: Erro ao atualizar metadata:', metadataError);
    }

    // Log de sucesso
    await supabase.from('system_logs').insert({
      event_type: 'meta_token_converted',
      message: 'Token curto convertido para token de longa duração com sucesso',
      details: {
        expires_at: expiresAt.toISOString(),
        days_until_expiry: Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        app_id: appId
      }
    });

    console.log('Token convertido com sucesso! Expira em:', expiresAt.toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token convertido para longa duração com sucesso',
        expires_at: expiresAt.toISOString(),
        days_until_expiry: Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
