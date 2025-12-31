import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('🔄 Iniciando renovação do token Meta...');

    // Buscar o token atual do banco
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .single();

    if (tokenError || !tokenData) {
      throw new Error(`Erro ao buscar token atual: ${tokenError?.message || 'Token não encontrado'}`);
    }

    const currentToken = tokenData.value;
    console.log('✅ Token atual encontrado');

    // Buscar metadata para verificar se o token ainda é válido
    const { data: metadataData } = await supabaseClient
      .from('meta_token_metadata')
      .select('*')
      .eq('token_type', 'access_token')
      .single();

    // Verificar se o token já expirou
    if (metadataData?.expires_at) {
      const expiresAt = new Date(metadataData.expires_at);
      const now = new Date();
      
      if (expiresAt < now) {
        console.warn('⚠️ Token já expirado! Tentando renovar mesmo assim...');
        
        // Atualizar metadata para refletir status expirado
        await supabaseClient
          .from('meta_token_metadata')
          .update({
            status: 'expired',
            last_checked: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('token_type', 'access_token');
      }
    }

    // Buscar credenciais do app
    const appId = metadataData?.details?.app_id || '383063434848211';
    const appSecret = Deno.env.get('META_APP_SECRET');

    if (!appSecret) {
      throw new Error('META_APP_SECRET não configurado nas variáveis de ambiente');
    }

    // Chamar API do Facebook para renovar o token
    const renewalUrl = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`;
    
    console.log('🌐 Chamando API do Facebook para renovar token...');
    const response = await fetch(renewalUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      
      // Se o erro indica token expirado, atualizar status
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        await supabaseClient
          .from('meta_token_metadata')
          .update({
            status: 'expired',
            last_checked: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            details: {
              ...(metadataData?.details || {}),
              last_renewal_error: errorMessage,
              last_renewal_attempt: new Date().toISOString()
            }
          })
          .eq('token_type', 'access_token');
      }
      
      throw new Error(`Erro na API do Facebook: ${errorMessage}`);
    }

    const renewalData = await response.json();
    const newToken = renewalData.access_token;
    const expiresIn = renewalData.expires_in; // segundos

    if (!newToken) {
      throw new Error('Novo token não retornado pela API');
    }

    console.log(`✅ Novo token recebido (expira em ${expiresIn} segundos = ${Math.floor(expiresIn / 86400)} dias)`);

    // Atualizar token no banco
    const { error: updateError } = await supabaseClient
      .from('api_tokens')
      .update({ 
        value: newToken,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'meta_access_token');

    if (updateError) {
      throw new Error(`Erro ao atualizar token: ${updateError.message}`);
    }

    // Calcular nova data de expiração
    const newExpiryDate = new Date(Date.now() + (expiresIn * 1000));

    // Atualizar metadata
    await supabaseClient
      .from('meta_token_metadata')
      .update({
        status: 'active',
        last_refreshed: new Date().toISOString(),
        last_checked: new Date().toISOString(),
        expires_at: newExpiryDate.toISOString(),
        updated_at: new Date().toISOString(),
        details: {
          ...(metadataData?.details || {}),
          app_id: appId,
          last_renewal_success: true,
          last_renewal_date: new Date().toISOString(),
          last_renewal_error: null,
          expires_in_seconds: expiresIn,
          expires_in_days: Math.floor(expiresIn / 86400)
        }
      })
      .eq('token_type', 'access_token');

    // Log de sucesso
    await supabaseClient
      .from('system_logs')
      .insert({
        event_type: 'meta_token_renewal',
        message: 'Token Meta renovado com sucesso',
        details: {
          renewed_at: new Date().toISOString(),
          expires_at: newExpiryDate.toISOString(),
          expires_in_days: Math.floor(expiresIn / 86400)
        }
      });

    // Log para cron
    await supabaseClient
      .from('cron_execution_logs')
      .insert({
        job_name: 'meta-token-renewal',
        status: 'success',
        details: {
          renewed_at: new Date().toISOString(),
          new_expiry: newExpiryDate.toISOString(),
          expires_in_days: Math.floor(expiresIn / 86400)
        }
      });

    console.log('✅ Token Meta renovado com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token renovado com sucesso',
        expires_at: newExpiryDate.toISOString(),
        expires_in_days: Math.floor(expiresIn / 86400)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro ao renovar token Meta:', error);

    // Log de erro
    await supabaseClient
      .from('system_logs')
      .insert({
        event_type: 'meta_token_renewal_error',
        message: 'Falha ao renovar token Meta',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

    await supabaseClient
      .from('cron_execution_logs')
      .insert({
        job_name: 'meta-token-renewal',
        status: 'error',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
