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

  const APP_ID = '383063434848211';
  const DAYS_THRESHOLD = 7; // Só renova se faltar 7 dias ou menos

  try {
    console.log('🔄 Verificando token Meta...');

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

    // Buscar metadata
    const { data: metadataData } = await supabaseClient
      .from('meta_token_metadata')
      .select('*')
      .eq('token_type', 'access_token')
      .single();

    // Buscar APP_SECRET
    const appSecret = Deno.env.get('META_APP_SECRET');
    if (!appSecret) {
      throw new Error('META_APP_SECRET não configurado nas variáveis de ambiente');
    }

    // ========== VALIDAÇÃO VIA DEBUG_TOKEN ==========
    console.log('🔍 Validando token via debug_token...');
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${currentToken}&access_token=${APP_ID}|${appSecret}`;
    
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();

    if (debugData.error) {
      throw new Error(`Erro ao validar token: ${debugData.error.message}`);
    }

    const tokenInfo = debugData.data;
    const isValid = tokenInfo.is_valid;
    const expiresAtTimestamp = tokenInfo.expires_at; // Unix timestamp (segundos)
    const scopes = tokenInfo.scopes || [];

    console.log(`📊 Token válido: ${isValid}, Scopes: ${scopes.join(', ')}`);

    // Se token inválido ou expirado
    if (!isValid || (expiresAtTimestamp && expiresAtTimestamp * 1000 < Date.now())) {
      console.warn('⚠️ Token inválido ou expirado!');
      
      await supabaseClient
        .from('meta_token_metadata')
        .update({
          status: 'expired',
          last_checked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          details: {
            ...(metadataData?.details || {}),
            scopes,
            is_valid: false,
            last_check_result: 'expired',
            last_check_date: new Date().toISOString()
          }
        })
        .eq('token_type', 'access_token');

      // Log
      await supabaseClient.from('cron_execution_logs').insert({
        job_name: 'meta-token-renewal',
        status: 'skipped',
        details: { reason: 'Token expirado - necessário inserir novo token manualmente' }
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token expirado. Necessário inserir novo token manualmente.',
          status: 'expired'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular dias restantes
    const expiresAt = new Date(expiresAtTimestamp * 1000);
    const now = new Date();
    const daysRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`📅 Token expira em ${daysRemaining} dias (${expiresAt.toISOString()})`);

    // Atualizar metadata com info atualizada
    await supabaseClient
      .from('meta_token_metadata')
      .update({
        status: daysRemaining <= 15 ? 'warning' : 'active',
        last_checked: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        details: {
          ...(metadataData?.details || {}),
          scopes,
          is_valid: true,
          days_remaining: daysRemaining,
          last_check_date: new Date().toISOString()
        }
      })
      .eq('token_type', 'access_token');

    // Se faltar mais de DAYS_THRESHOLD dias, não renova
    if (daysRemaining > DAYS_THRESHOLD) {
      console.log(`✅ Token ainda válido por ${daysRemaining} dias. Renovação não necessária (threshold: ${DAYS_THRESHOLD} dias).`);
      
      await supabaseClient.from('cron_execution_logs').insert({
        job_name: 'meta-token-renewal',
        status: 'skipped',
        details: { 
          reason: `Token ainda válido por ${daysRemaining} dias`,
          threshold: DAYS_THRESHOLD,
          expires_at: expiresAt.toISOString()
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Token válido por mais ${daysRemaining} dias. Renovação não necessária.`,
          days_remaining: daysRemaining,
          expires_at: expiresAt.toISOString(),
          renewed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== RENOVAÇÃO DO TOKEN ==========
    console.log(`🔄 Renovando token (faltam ${daysRemaining} dias)...`);

    const renewalUrl = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`;
    
    const response = await fetch(renewalUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      
      await supabaseClient
        .from('meta_token_metadata')
        .update({
          updated_at: new Date().toISOString(),
          details: {
            ...(metadataData?.details || {}),
            last_renewal_error: errorMessage,
            last_renewal_attempt: new Date().toISOString()
          }
        })
        .eq('token_type', 'access_token');
      
      throw new Error(`Erro na API do Facebook: ${errorMessage}`);
    }

    const renewalData = await response.json();
    const newToken = renewalData.access_token;
    const expiresIn = renewalData.expires_in; // segundos

    if (!newToken) {
      throw new Error('Novo token não retornado pela API');
    }

    console.log(`✅ Novo token recebido (expira em ${Math.floor(expiresIn / 86400)} dias)`);

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
          app_id: APP_ID,
          scopes,
          is_valid: true,
          last_renewal_success: true,
          last_renewal_date: new Date().toISOString(),
          last_renewal_error: null,
          expires_in_seconds: expiresIn,
          expires_in_days: Math.floor(expiresIn / 86400)
        }
      })
      .eq('token_type', 'access_token');

    // Log de sucesso
    await supabaseClient.from('system_logs').insert({
      event_type: 'meta_token_renewal',
      message: 'Token Meta renovado com sucesso',
      details: {
        renewed_at: new Date().toISOString(),
        expires_at: newExpiryDate.toISOString(),
        expires_in_days: Math.floor(expiresIn / 86400)
      }
    });

    await supabaseClient.from('cron_execution_logs').insert({
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
        expires_in_days: Math.floor(expiresIn / 86400),
        renewed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro ao processar token Meta:', error);

    await supabaseClient.from('system_logs').insert({
      event_type: 'meta_token_renewal_error',
      message: 'Falha ao processar token Meta',
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });

    await supabaseClient.from('cron_execution_logs').insert({
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
