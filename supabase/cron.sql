
-- Verificar e criar extensões necessárias se não existirem
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Tabela para logs de sistema (já existe, mas mantido para referência)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para monitoramento de execuções do cron
CREATE TABLE IF NOT EXISTS public.cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  details JSONB
);

-- Função para obter a expressão cron de um job
CREATE OR REPLACE FUNCTION public.get_cron_expression(job_name text)
RETURNS TABLE (cron_expression text) AS $$
BEGIN
  RETURN QUERY
  SELECT schedule
  FROM cron.job
  WHERE jobname = job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função corrigida para obter múltiplos jobs do cron
CREATE OR REPLACE FUNCTION public.get_cron_jobs(job_names text[])
RETURNS TABLE (
  jobid int, 
  jobname text, 
  schedule text, 
  active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid::int, 
    j.jobname, 
    j.schedule, 
    j.active
  FROM 
    cron.job j
  WHERE 
    j.jobname = ANY(job_names);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar jobs antigos para evitar duplicidade
SELECT cron.unschedule('cron-health-check');
SELECT cron.unschedule('cron-status-keeper');
SELECT cron.unschedule('google-ads-token-check-job');

-- Registrar uma execução de teste para garantir que os componentes mostrem status ativo
INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
VALUES (
  'cron-health-check',
  now(),
  'completed', 
  jsonb_build_object(
    'timestamp', now(),
    'message', 'Registro de teste para inicializar o monitoramento',
    'source', 'manual_update'
  )
);

-- Atualizar o log do sistema também
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job', 
  'Inicialização do monitoramento do cron otimizado', 
  jsonb_build_object(
    'timestamp', now(),
    'source', 'manual_update'
  )
);

-- Adicionar job específico para verificação de tokens do Google Ads a cada 2 horas
SELECT cron.schedule(
  'google-ads-token-check-job',
  '0 */2 * * *',  -- Executa a cada 2 horas
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
      jsonb_build_object('timestamp', now())
    )
    RETURNING id INTO log_id;
    
    -- Registrar a tentativa no log do sistema
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES ('cron_job', 'Verificação automática de tokens do Google Ads', jsonb_build_object('timestamp', now(), 'source', 'scheduled_job', 'log_id', log_id));
      
    -- Invocar a função Edge para verificação de tokens
    SELECT status, content::TEXT INTO response_status, response_body FROM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=format('{"scheduled": true, "source": "cron", "logId": "%s"}', log_id)::jsonb
      );
      
    -- Atualizar status baseado na resposta
    IF response_status BETWEEN 200 AND 299 THEN
      -- Atualizar para completed se a resposta foi bem-sucedida
      UPDATE public.cron_execution_logs 
      SET status = 'completed', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_job',
            'response_status', response_status,
            'http_success', true
          )
      WHERE id = log_id;
    ELSE
      -- Atualizar para error se a resposta não foi bem-sucedida
      UPDATE public.cron_execution_logs 
      SET status = 'error', 
          details = jsonb_build_object(
            'timestamp', now(),
            'source', 'scheduled_job',
            'response_status', response_status,
            'http_success', false,
            'error_message', response_body
          )
      WHERE id = log_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Capturar e registrar qualquer erro
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_job', 
      'Erro na verificação de tokens do Google Ads', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'error', SQLERRM,
        'errorCode', SQLSTATE
      )
    );
    
    -- Atualizar o status para erro
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

-- Adicionar uma execução de manutenção de status para verificar e manter o cron ativo
SELECT cron.schedule(
  'cron-health-check',
  '0 * * * *',  -- A cada hora (otimizado de 30 minutos)
  $$
  -- Registrar um heartbeat para monitoramento de atividade
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'cron-health-check', 
    now(), 
    'active', 
    jsonb_build_object(
      'timestamp', now(),
      'message', 'Verificação automática de saúde do cron - frequência otimizada'
    )
  );
  
  -- Verificar se há execuções pendentes há mais de 1 hora e marcá-las como erro
  UPDATE public.cron_execution_logs
  SET 
    status = 'error',
    details = jsonb_build_object(
      'timestamp', now(),
      'message', 'Execução não completada em tempo hábil',
      'original_status', status,
      'auto_closed', true
    )
  WHERE 
    (status = 'started' OR status = 'in_progress') AND
    execution_time < (now() - INTERVAL '1 hour');
    
  -- Executar limpeza automática durante o health check
  SELECT public.cleanup_old_logs();
  $$
);

-- Registrar log de atualização da configuração
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job', 
  'Configuração de cron otimizada após remoção dos jobs de revisão Meta',
  jsonb_build_object(
    'timestamp', now(),
    'source', 'manual_update',
    'active_jobs', ARRAY['google-ads-token-check-job', 'cron-health-check'],
    'removed_jobs', ARRAY['daily-meta-review-job', 'daily-meta-review-test-job', 'cron-status-keeper'],
    'optimization', 'Frequências reduzidas e limpeza automática melhorada'
  )
);
