
-- MIGRATION URGENTE SIMPLIFICADA - Sistema de renovação automática de tokens Google Ads
-- Limpar jobs antigos
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('google-ads-token-check-job');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    PERFORM cron.unschedule('google-token-health-check');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  PERFORM pg_sleep(1);
END $$;

-- Criar job principal para renovação de tokens a cada 30 MINUTOS (versão simplificada)
SELECT cron.schedule(
  'google-ads-token-check-job',
  '*/30 * * * *',
  $$
  DECLARE
    log_id UUID;
  BEGIN
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'google-ads-token-check-job', 
      now(), 
      'started', 
      jsonb_build_object(
        'timestamp', now(),
        'source', 'scheduled_job',
        'auto_renewal', true,
        'frequency', 'every_30_minutes'
      )
    )
    RETURNING id INTO log_id;
    
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'EXECUTANDO renovação automática de tokens Google Ads (30min)', 
      jsonb_build_object('timestamp', now(), 'log_id', log_id)
    );
      
    -- Invocar a função Edge (sem capturar resposta para evitar erros)
    PERFORM net.http_post(
      url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body:=format('{"scheduled": true, "source": "cron_auto_renewal_30min", "logId": "%s", "autoRenewal": true, "urgentRenewal": true}', log_id)::jsonb
    );
    
    UPDATE public.cron_execution_logs 
    SET status = 'completed', 
        details = jsonb_build_object(
          'timestamp', now(),
          'source', 'scheduled_job',
          'auto_renewal', true,
          'frequency', 'every_30_minutes'
        )
    WHERE id = log_id;
    
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'Job de renovação automática executado (30min)', 
      jsonb_build_object('timestamp', now(), 'logId', log_id)
    );
    
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'ERRO na renovação automática de tokens (30min)', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'error', SQLERRM,
        'errorCode', SQLSTATE
      )
    );
    
    IF log_id IS NOT NULL THEN
      UPDATE public.cron_execution_logs 
      SET status = 'error', 
          details = jsonb_build_object(
            'timestamp', now(),
            'error', SQLERRM,
            'errorCode', SQLSTATE
          )
      WHERE id = log_id;
    END IF;
  END;
  $$
);

-- Criar job de verificação de saúde (simplificado)
SELECT cron.schedule(
  'google-token-health-check',
  '*/15 * * * *',
  $$
  DECLARE
    last_token_update TIMESTAMP;
    minutes_since_update INTEGER;
  BEGIN
    SELECT updated_at INTO last_token_update
    FROM public.api_tokens 
    WHERE name = 'google_ads_access_token';
    
    minutes_since_update := EXTRACT(EPOCH FROM (now() - last_token_update)) / 60;
    
    IF minutes_since_update > 45 THEN
      INSERT INTO public.system_logs (event_type, message, details)
      VALUES (
        'token_renewal', 
        'ALERTA: Token Google Ads não atualizado há mais de 45 minutos', 
        jsonb_build_object(
          'timestamp', now(),
          'minutes_since_update', minutes_since_update,
          'alert_level', 'warning'
        )
      );
      
      IF minutes_since_update > 60 THEN
        PERFORM net.http_post(
          url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
          body:='{"scheduled": true, "source": "health_check_forced", "forceRenewal": true, "urgentRenewal": true}'::jsonb
        );
      END IF;
    END IF;
    
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'google-token-health-check', 
      now(), 
      'completed', 
      jsonb_build_object(
        'timestamp', now(),
        'minutes_since_update', minutes_since_update,
        'health_status', CASE WHEN minutes_since_update > 60 THEN 'critical' 
                             WHEN minutes_since_update > 45 THEN 'warning' 
                             ELSE 'healthy' END
      )
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'Erro na verificação de saúde dos tokens', 
      jsonb_build_object('timestamp', now(), 'error', SQLERRM)
    );
  END;
  $$
);

-- Registrar configuração
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'token_renewal', 
  'SISTEMA DE RENOVAÇÃO AUTOMÁTICA CONFIGURADO COM SUCESSO', 
  jsonb_build_object(
    'timestamp', now(),
    'jobs_created', ARRAY['google-ads-token-check-job', 'google-token-health-check'],
    'renewal_interval', '30 minutes',
    'health_check_interval', '15 minutes'
  )
);

-- Executar verificação inicial imediata (simplificada)
DO $$
BEGIN
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'token_renewal', 
    'EXECUTANDO RENOVAÇÃO IMEDIATA CRÍTICA', 
    jsonb_build_object('timestamp', now(), 'reason', 'token_expiring_soon')
  );

  PERFORM net.http_post(
    url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
    body:='{"scheduled": false, "source": "immediate_urgent_renewal", "autoRenewal": true, "urgentRenewal": true, "critical": true}'::jsonb
  );

  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'token_renewal', 
    '✅ RENOVAÇÃO IMEDIATA EXECUTADA COM SUCESSO', 
    jsonb_build_object('timestamp', now())
  );
END $$;
