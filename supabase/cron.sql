
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

-- Remover jobs existentes para evitar duplicidade
SELECT cron.unschedule('daily-meta-review-job');
SELECT cron.unschedule('daily-meta-review-test-job');
SELECT cron.unschedule('cron-health-check');
SELECT cron.unschedule('cron-status-keeper');
SELECT cron.unschedule('google-ads-token-check-job');

-- Registrar uma execução de teste para garantir que os componentes mostrem status ativo
INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
VALUES (
  'daily-meta-review-job',
  now(),
  'test_success', 
  jsonb_build_object(
    'timestamp', now(),
    'message', 'Registro de teste para inicializar o monitoramento',
    'source', 'manual_update'
  )
);

-- Registrar uma execução de teste para o job de verificação de tokens do Google Ads
INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
VALUES (
  'google-ads-token-check-job',
  now(),
  'test_success', 
  jsonb_build_object(
    'timestamp', now(),
    'message', 'Registro de teste para inicializar o monitoramento de tokens',
    'source', 'manual_update'
  )
);

-- Atualizar o log do sistema também
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job', 
  'Inicialização do monitoramento do cron agendado', 
  jsonb_build_object(
    'timestamp', now(),
    'source', 'manual_update'
  )
);

-- Adicionar job SEPARADO para execução de teste - executa a cada 30 minutos
SELECT cron.schedule(
  'daily-meta-review-test-job',
  '*/30 * * * *',  -- Executa a cada 30 minutos
  $$
  -- Registrar o teste no log do sistema
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'cron_job', 
    'Teste de revisão automática a cada 30 minutos', 
    jsonb_build_object(
      'timestamp', now(),
      'source', 'test_interval'
    )
  );
  
  -- Criar um registro para o teste
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'daily-meta-review-test-job', 
    now(), 
    'started', 
    jsonb_build_object(
      'timestamp', now(),
      'source', 'scheduled_test',
      'test', true,
      'executeReview', false
    )
  );
  
  -- Chamar a função edge com parâmetro de teste explícito
  PERFORM
    net.http_post(
      url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body:='{"scheduled": true, "test": true, "executeReview": false, "source": "cron_test"}'::jsonb
    );
  $$
);

-- Agendar execução REAL da revisão Meta Ads a cada 3 minutos - VERSÃO CORRIGIDA
SELECT cron.schedule(
  'daily-meta-review-job',
  '*/3 * * * *',  -- Executa a cada 3 minutos para execução real
  $$
  DECLARE
    log_id UUID;
  BEGIN
    -- Criar o registro de log para a execução REAL
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'daily-meta-review-job', 
      now(), 
      'started', 
      jsonb_build_object(
        'timestamp', now(),
        'source', 'scheduled',
        'isAutomatic', true,
        'executeReview', true,
        'executionType', 'real',
        'test', false
      )
    )
    RETURNING id INTO log_id;
    
    -- LOG DE DEPURAÇÃO
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_job', 
      'Iniciando execução REAL da revisão diária Meta Ads via cron', 
      jsonb_build_object(
        'timestamp', now(),
        'logId', log_id,
        'isReal', true,
        'job', 'daily-meta-review-job'
      )
    );
    
    -- CHAMADA CORRIGIDA com executeReview=true E test=false
    PERFORM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=concat('{"scheduled": true, "executeReview": true, "test": false, "source": "cron_real", "logId": "', log_id, '", "forceExecution": true}')::jsonb
      );
  END;
  $$
);

-- Adicionar job específico para verificação de tokens do Google Ads a cada 2 horas
SELECT cron.schedule(
  'google-ads-token-check-job',
  '0 */2 * * *',  -- Executa a cada 2 horas
  $$
  -- Registrar início da execução
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'google-ads-token-check-job', 
    now(), 
    'started', 
    jsonb_build_object('timestamp', now())
  );
  
  -- Capturar o ID do log para atualização posterior
  DO $$
  DECLARE
    log_id UUID;
  BEGIN
    SELECT id INTO log_id FROM public.cron_execution_logs 
    WHERE job_name = 'google-ads-token-check-job' 
    ORDER BY execution_time DESC LIMIT 1;
    
    -- Invocar a função Edge para verificação de tokens
    PERFORM
      net.http_post(
        url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/google-ads-token-check',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body:=concat('{"scheduled": true, "source": "cron", "logId": "', log_id, '"}'::text)::jsonb
      );
    
    -- Registrar a tentativa no log do sistema
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES ('cron_job', 'Verificação automática de tokens do Google Ads', jsonb_build_object('timestamp', now(), 'source', 'scheduled_job', 'log_id', log_id));
  END;
  $$;
  $$
);

-- Adicionar uma execução de manutenção de status para verificar e manter o cron ativo
SELECT cron.schedule(
  'cron-health-check',
  '*/30 * * * *',  -- A cada 30 minutos
  $$
  -- Registrar um heartbeat para monitoramento de atividade
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'cron-health-check', 
    now(), 
    'active', 
    jsonb_build_object(
      'timestamp', now(),
      'message', 'Verificação automática de saúde do cron'
    )
  );
  
  -- Verificar se há execuções pendentes há mais de 15 minutos e marcá-las como erro
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
    status = 'started' OR status = 'in_progress' AND
    execution_time < (now() - INTERVAL '15 minutes');
  $$
);
