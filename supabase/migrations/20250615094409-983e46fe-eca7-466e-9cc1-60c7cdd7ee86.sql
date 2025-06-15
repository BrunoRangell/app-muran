
-- Agendar a execução da atualização de saúde das campanhas a cada hora
-- Se um job com o mesmo nome já existir, ele será atualizado.
SELECT cron.schedule(
  'campaign-health-hourly-update',
  '0 * * * *',  -- Executa no minuto 0 de cada hora
  $$
  DECLARE
    log_id UUID;
    response_status INTEGER;
    response_body TEXT;
  BEGIN
    -- Registrar o início da execução no log de cron
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'campaign-health-hourly-update', 
      now(), 
      'started', 
      jsonb_build_object('timestamp', now(), 'source', 'scheduled_hourly')
    )
    RETURNING id INTO log_id;
    
    -- Chamar a função edge que atualiza os dados
    SELECT status, content::TEXT INTO response_status, response_body FROM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/active-campaigns-health',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=format('{"source": "cron_hourly_update", "logId": "%s"}', log_id)::jsonb
      );
      
    -- Atualizar o log de execução com o resultado
    IF response_status BETWEEN 200 AND 299 THEN
      UPDATE public.cron_execution_logs 
      SET status = 'completed', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_hourly',
            'response_status', response_status,
            'http_success', true
          )
      WHERE id = log_id;
    ELSE
      UPDATE public.cron_execution_logs 
      SET status = 'error', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_hourly',
            'response_status', response_status,
            'http_success', false,
            'error_message', response_body
          )
      WHERE id = log_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Capturar e registrar qualquer erro inesperado
    UPDATE public.cron_execution_logs 
    SET status = 'error', 
        details = jsonb_build_object(
          'timestamp', now(),
          'error', SQLERRM,
          'errorCode', SQLSTATE
        )
    WHERE id = log_id;
  END;
  $$
);

-- Adiciona o novo job ao log de configuração do sistema para referência
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job_update', 
  'Adicionado agendamento para atualização horária da saúde das campanhas.', 
  jsonb_build_object(
    'timestamp', now(),
    'source', 'manual_update',
    'job_name', 'campaign-health-hourly-update'
  )
);
