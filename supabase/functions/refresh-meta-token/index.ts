import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MIN_ACCEPTABLE_DAYS = 7;
const ALERT_DEDUP_HOURS = 12;

// Envia alerta no Discord (reaproveita o canal de saldo baixo) quando o token
// expira, fica indisponível para renovação automática, ou se aproxima do limite.
// Faz dedup via meta_token_metadata.details.last_alert_sent_at por severidade.
async function maybeSendDiscordAlert(
  supabase: any,
  metadata: any,
  severity: 'expired' | 'needs_manual_renewal' | 'warning',
  expiresAt: Date | null,
  daysRemaining: number | null,
) {
  try {
    const token = Deno.env.get('DISCORD_TOKEN');
    const channelId = Deno.env.get('DISCORD_LOW_BALANCE_CHANNEL_ID');
    if (!token || !channelId) {
      console.warn('⚠️ DISCORD_TOKEN/DISCORD_LOW_BALANCE_CHANNEL_ID não configurados — pulando alerta');
      return;
    }

    const details = metadata?.details || {};
    const lastAlerts = details.last_alert_sent_at || {};
    const lastForSeverity = lastAlerts[severity] ? new Date(lastAlerts[severity]).getTime() : 0;
    const dedupMs = ALERT_DEDUP_HOURS * 60 * 60 * 1000;
    if (Date.now() - lastForSeverity < dedupMs) {
      console.log(`ℹ️ Alerta Discord (${severity}) já enviado nas últimas ${ALERT_DEDUP_HOURS}h — pulando`);
      return;
    }

    const expiresLabel = expiresAt
      ? expiresAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : 'desconhecida';
    let content = '';
    if (severity === 'expired') {
      content = `@everyone 🚨 **Token Meta EXPIROU** em ${expiresLabel}.\nAs revisões automáticas estão falhando. Renove manualmente em **Configurações → API Meta**.`;
    } else if (severity === 'needs_manual_renewal') {
      content = `@everyone ⚠️ **Token Meta atingiu o limite de renovação automática** (expira em ${expiresLabel}, faltam ${daysRemaining} dia(s)).\nÉ preciso gerar um novo token manualmente em **Configurações → API Meta** antes da expiração.`;
    } else {
      content = `@everyone ⏰ Token Meta expira em **${daysRemaining} dia(s)** (${expiresLabel}) e a renovação automática não está conseguindo estender.\nPrepare a renovação manual em **Configurações → API Meta**.`;
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, allowed_mentions: { parse: ['everyone'] } }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('❌ Falha ao enviar alerta Discord:', res.status, body);
      return;
    }

    const newAlerts = { ...lastAlerts, [severity]: new Date().toISOString() };
    await supabase
      .from('meta_token_metadata')
      .update({
        details: { ...details, last_alert_sent_at: newAlerts },
        updated_at: new Date().toISOString(),
      })
      .eq('token_type', 'access_token');
    console.log(`✅ Alerta Discord enviado (${severity})`);
  } catch (err) {
    console.error('❌ Erro ao enviar alerta Discord:', err);
  }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const APP_ID = '383063434848211';
  const DAYS_THRESHOLD = 7;

  try {
    console.log('🔄 Verificando token Meta...');

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

    const { data: metadataData } = await supabaseClient
      .from('meta_token_metadata')
      .select('*')
      .eq('token_type', 'access_token')
      .single();

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
    const expiresAtTimestamp = tokenInfo.expires_at;
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

      await supabaseClient.from('cron_execution_logs').insert({
        job_name: 'meta-token-renewal',
        status: 'skipped',
        details: { reason: 'Token expirado - necessário inserir novo token manualmente' }
      });

      const expiredAt = expiresAtTimestamp ? new Date(expiresAtTimestamp * 1000) : null;
      await maybeSendDiscordAlert(supabaseClient, metadataData, 'expired', expiredAt, 0);

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
      console.log(`✅ Token ainda válido por ${daysRemaining} dias. Renovação não necessária.`);
      
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

    // Calcular nova data de expiração
    const newExpiryDate = new Date(Date.now() + (expiresIn * 1000));
    const newDaysRemaining = Math.floor((newExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`📊 Novo token recebido. Expira em ${newDaysRemaining} dias (${newExpiryDate.toISOString()})`);

    // ========== VERIFICAÇÃO: A renovação foi realmente efetiva? ==========
    if (newDaysRemaining < MIN_ACCEPTABLE_DAYS) {
      console.warn(`⚠️ Renovação INEFICAZ! Novo token expira em apenas ${newDaysRemaining} dias. Mínimo aceitável: ${MIN_ACCEPTABLE_DAYS} dias.`);
      console.warn('⚠️ O token atingiu o limite máximo de extensão do Meta. É necessário gerar um novo token manualmente.');

      // NÃO salvar o token no api_tokens (evita trigger loop desnecessário)
      // Apenas atualizar metadata com status de alerta
      await supabaseClient
        .from('meta_token_metadata')
        .update({
          status: 'needs_manual_renewal',
          last_checked: new Date().toISOString(),
          expires_at: expiresAt.toISOString(), // manter a expiração do token atual
          updated_at: new Date().toISOString(),
          details: {
            ...(metadataData?.details || {}),
            scopes,
            is_valid: true,
            days_remaining: daysRemaining,
            renewal_ineffective: true,
            renewal_attempted_at: new Date().toISOString(),
            new_token_would_expire_in_days: newDaysRemaining,
            reason: 'Token atingiu limite máximo de extensão. Necessário gerar novo token manualmente.'
          }
        })
        .eq('token_type', 'access_token');

      // Log claro
      await supabaseClient.from('system_logs').insert({
        event_type: 'meta_token_renewal_ineffective',
        message: 'Renovação do token Meta foi ineficaz - token precisa ser gerado manualmente',
        details: {
          current_expires_at: expiresAt.toISOString(),
          new_would_expire_at: newExpiryDate.toISOString(),
          new_days_remaining: newDaysRemaining,
          min_acceptable_days: MIN_ACCEPTABLE_DAYS,
          timestamp: new Date().toISOString()
        }
      });

      await supabaseClient.from('cron_execution_logs').insert({
        job_name: 'meta-token-renewal',
        status: 'ineffective',
        details: {
          reason: `Renovação ineficaz - novo token expiraria em ${newDaysRemaining} dias (mínimo: ${MIN_ACCEPTABLE_DAYS})`,
          current_expires_at: expiresAt.toISOString(),
          action_required: 'Gerar novo token manualmente'
        }
      });

      // Recarregar metadata para garantir dedup correto
      const { data: refreshedMeta } = await supabaseClient
        .from('meta_token_metadata')
        .select('*')
        .eq('token_type', 'access_token')
        .single();
      await maybeSendDiscordAlert(supabaseClient, refreshedMeta, 'needs_manual_renewal', expiresAt, daysRemaining);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Renovação ineficaz. Token precisa ser gerado manualmente.',
          current_days_remaining: daysRemaining,
          new_would_expire_in_days: newDaysRemaining,
          renewed: false,
          action_required: 'manual_renewal'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== RENOVAÇÃO EFETIVA - SALVAR ==========
    console.log(`✅ Renovação efetiva! Novo token expira em ${newDaysRemaining} dias.`);

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
          renewal_ineffective: false,
          expires_in_seconds: expiresIn,
          expires_in_days: newDaysRemaining
        }
      })
      .eq('token_type', 'access_token');

    await supabaseClient.from('system_logs').insert({
      event_type: 'meta_token_renewal',
      message: 'Token Meta renovado com sucesso',
      details: {
        renewed_at: new Date().toISOString(),
        expires_at: newExpiryDate.toISOString(),
        expires_in_days: newDaysRemaining
      }
    });

    await supabaseClient.from('cron_execution_logs').insert({
      job_name: 'meta-token-renewal',
      status: 'success',
      details: {
        renewed_at: new Date().toISOString(),
        new_expiry: newExpiryDate.toISOString(),
        expires_in_days: newDaysRemaining
      }
    });

    console.log('✅ Token Meta renovado com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token renovado com sucesso',
        expires_at: newExpiryDate.toISOString(),
        expires_in_days: newDaysRemaining,
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
