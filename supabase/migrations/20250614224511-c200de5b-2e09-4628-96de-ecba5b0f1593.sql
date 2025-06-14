
-- Corrigir a função get_cron_jobs para ter tipos de dados consistentes
DROP FUNCTION IF EXISTS public.get_cron_jobs(text[]);

CREATE OR REPLACE FUNCTION public.get_cron_jobs(job_names text[])
RETURNS TABLE(
  jobid bigint, 
  jobname text, 
  schedule text, 
  active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid::bigint, 
    j.jobname, 
    j.schedule, 
    j.active
  FROM 
    cron.job j
  WHERE 
    j.jobname = ANY(job_names);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar jobs antigos de forma segura (ignorar erros se não existirem)
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('google-ads-token-check-job');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar erro se job não existir
  END;
  
  BEGIN
    PERFORM cron.unschedule('google-token-health-check');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar erro se job não existir
  END;
END $$;

-- Criar job principal para renovação de tokens a cada 30 MINUTOS (CORREÇÃO CRÍTICA)
SELECT cron.schedule(
  'google-ads-token-check-job',
  '*/30 * * * *',  -- A cada 30 minutos (MUITO MAIS FREQUENTE)
  $$
  DECLARE
    log_id UUID;
    response_status INTEGER;
    response_body TEXT;
  BEGIN
    -- Registrar início da execução
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
    
    -- Registrar no log do sistema
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'Iniciando renovação automática de tokens Google Ads (30min)', 
      jsonb_build_object(
        'timestamp', now(), 
        'source', 'scheduled_job', 
        'log_id', log_id,
        'frequency', 'every_30_minutes'
      )
    );
      
    -- Invocar a função Edge para verificação/renovação de tokens
    SELECT status, content::TEXT INTO response_status, response_body FROM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=format('{"scheduled": true, "source": "cron_auto_renewal_30min", "logId": "%s", "autoRenewal": true, "urgentRenewal": true}', log_id)::jsonb
      );
      
    -- Registrar resposta no log do sistema
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'Resposta da função Edge recebida (30min)', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'status', response_status,
        'response', response_body,
        'frequency', 'every_30_minutes'
      )
    );
    
    -- Atualizar status baseado na resposta
    IF response_status BETWEEN 200 AND 299 THEN
      UPDATE public.cron_execution_logs 
      SET status = 'completed', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_job',
            'auto_renewal', true,
            'response_status', response_status,
            'http_success', true,
            'frequency', 'every_30_minutes'
          )
      WHERE id = log_id;
      
      -- Log de sucesso
      INSERT INTO public.system_logs (event_type, message, details)
      VALUES (
        'token_renewal', 
        'Renovação automática de tokens concluída com sucesso (30min)', 
        jsonb_build_object(
          'timestamp', now(),
          'logId', log_id,
          'status', 'success',
          'frequency', 'every_30_minutes'
        )
      );
    ELSE
      UPDATE public.cron_execution_logs 
      SET status = 'error', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_job',
            'auto_renewal', true,
            'response_status', response_status,
            'http_success', false,
            'error_message', response_body,
            'frequency', 'every_30_minutes'
          )
      WHERE id = log_id;
      
      -- Log de erro
      INSERT INTO public.system_logs (event_type, message, details)
      VALUES (
        'token_renewal', 
        'Erro na renovação automática de tokens (30min)', 
        jsonb_build_object(
          'timestamp', now(),
          'logId', log_id,
          'status', 'error',
          'error', response_body,
          'frequency', 'every_30_minutes'
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Capturar e registrar qualquer erro
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'Erro crítico na renovação automática de tokens (30min)', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'error', SQLERRM,
        'errorCode', SQLSTATE,
        'frequency', 'every_30_minutes'
      )
    );
    
    -- Atualizar o status para erro se o log_id existir
    IF log_id IS NOT NULL THEN
      UPDATE public.cron_execution_logs 
      SET status = 'error', 
          details = jsonb_build_object(
            'timestamp', now(),
            'error', SQLERRM,
            'errorCode', SQLSTATE,
            'source', 'scheduled_job',
            'auto_renewal', true,
            'frequency', 'every_30_minutes'
          )
      WHERE id = log_id;
    END IF;
  END;
  $$
);

-- Criar job de verificação de saúde dos tokens (executa a cada 15 minutos para monitoramento mais próximo)
SELECT cron.schedule(
  'google-token-health-check',
  '*/15 * * * *',  -- A cada 15 minutos para monitoramento mais próximo
  $$
  DECLARE
    last_token_update TIMESTAMP;
    hours_since_update INTEGER;
    minutes_since_update INTEGER;
  BEGIN
    -- Verificar quando foi a última atualização do access token
    SELECT updated_at INTO last_token_update
    FROM public.api_tokens 
    WHERE name = 'google_ads_access_token';
    
    -- Calcular quantos minutos se passaram desde a última atualização
    minutes_since_update := EXTRACT(EPOCH FROM (now() - last_token_update)) / 60;
    hours_since_update := minutes_since_update / 60;
    
    -- Se passou mais de 90 minutos sem atualização, registrar alerta
    IF minutes_since_update > 90 THEN
      INSERT INTO public.system_logs (event_type, message, details)
      VALUES (
        'token_renewal', 
        'ALERTA: Token Google Ads não foi atualizado há mais de 90 minutos', 
        jsonb_build_object(
          'timestamp', now(),
          'minutes_since_update', minutes_since_update,
          'hours_since_update', hours_since_update,
          'last_update', last_token_update,
          'alert_level', 'warning'
        )
      );
      
      -- Se passou mais de 2 horas, tentar forçar renovação
      IF minutes_since_update > 120 THEN
        INSERT INTO public.system_logs (event_type, message, details)
        VALUES (
          'token_renewal', 
          'CRÍTICO: Forçando renovação de token após 2+ horas sem atualização', 
          jsonb_build_object(
            'timestamp', now(),
            'minutes_since_update', minutes_since_update,
            'hours_since_update', hours_since_update,
            'action', 'force_renewal'
          )
        );
        
        -- Forçar execução da renovação
        PERFORM
          net.http_post(
            url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
            body:='{"scheduled": true, "source": "health_check_forced", "forceRenewal": true, "urgentRenewal": true}'::jsonb
          );
      END IF;
    ELSE
      -- Registrar que está tudo normal apenas a cada hora para não encher o log
      IF EXTRACT(MINUTE FROM now()) = 0 THEN
        INSERT INTO public.system_logs (event_type, message, details)
        VALUES (
          'token_renewal', 
          'Verificação de saúde: Tokens Google Ads atualizados recentemente', 
          jsonb_build_object(
            'timestamp', now(),
            'minutes_since_update', minutes_since_update,
            'hours_since_update', hours_since_update,
            'last_update', last_token_update,
            'status', 'healthy'
          )
        );
      END IF;
    END IF;
    
    -- Registrar execução da verificação de saúde apenas se houver problemas ou a cada hora
    IF minutes_since_update > 90 OR EXTRACT(MINUTE FROM now()) = 0 THEN
      INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
      VALUES (
        'google-token-health-check', 
        now(), 
        'completed', 
        jsonb_build_object(
          'timestamp', now(),
          'minutes_since_update', minutes_since_update,
          'hours_since_update', hours_since_update,
          'health_status', CASE WHEN minutes_since_update > 120 THEN 'critical' 
                               WHEN minutes_since_update > 90 THEN 'warning' 
                               ELSE 'healthy' END
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Registrar erro na verificação de saúde
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'token_renewal', 
      'Erro na verificação de saúde dos tokens', 
      jsonb_build_object(
        'timestamp', now(),
        'error', SQLERRM,
        'errorCode', SQLSTATE
      )
    );
  END;
  $$
);

-- Registrar que a configuração foi atualizada com nova frequência
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'token_renewal', 
  'Sistema de renovação automática de tokens Google Ads reconfigurado para alta frequência', 
  jsonb_build_object(
    'timestamp', now(),
    'jobs_created', ARRAY['google-ads-token-check-job', 'google-token-health-check'],
    'renewal_interval', '30 minutes',
    'health_check_interval', '15 minutes',
    'reason', 'urgent_fix_for_token_expiration'
  )
);

-- Executar uma verificação inicial imediatamente para renovar o token que está expirando
DO $$
DECLARE
  response_status INTEGER;
  response_body TEXT;
  log_id UUID;
BEGIN
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'google-ads-token-check-job', 
    now(), 
    'started', 
    jsonb_build_object(
      'timestamp', now(),
      'source', 'immediate_urgent_renewal',
      'auto_renewal', true,
      'reason', 'token_expiring_in_26_minutes'
    )
  )
  RETURNING id INTO log_id;

  -- Executar renovação imediata
  SELECT status, content::TEXT INTO response_status, response_body FROM
    net.http_post(
      url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body:=format('{"scheduled": false, "source": "immediate_urgent_renewal", "logId": "%s", "autoRenewal": true, "urgentRenewal": true}', log_id)::jsonb
    );

  -- Registrar resultado
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'token_renewal', 
    'Renovação URGENTE executada imediatamente', 
    jsonb_build_object(
      'timestamp', now(),
      'logId', log_id,
      'status', response_status,
      'response', response_body,
      'reason', 'token_expiring_in_26_minutes'
    )
  );

  -- Atualizar status
  IF response_status BETWEEN 200 AND 299 THEN
    UPDATE public.cron_execution_logs 
    SET status = 'completed', 
        details = jsonb_build_object(
          'timestamp', now(),
          'source', 'immediate_urgent_renewal',
          'response_status', response_status,
          'http_success', true,
          'reason', 'token_expiring_in_26_minutes'
        )
    WHERE id = log_id;
  ELSE
    UPDATE public.cron_execution_logs 
    SET status = 'error', 
        details = jsonb_build_object(
          'timestamp', now(),
          'source', 'immediate_urgent_renewal',
          'response_status', response_status,
          'http_success', false,
          'error_message', response_body,
          'reason', 'token_expiring_in_26_minutes'
        )
    WHERE id = log_id;
  END IF;
END $$;
