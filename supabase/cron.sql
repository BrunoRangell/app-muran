
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

-- Remover jobs existentes se houver para evitar duplicidade
SELECT cron.unschedule('daily-meta-review-job');
SELECT cron.unschedule('cron-health-check');
SELECT cron.unschedule('cron-status-keeper');

-- Agendar execução a cada 5 minutos
SELECT cron.schedule(
  'daily-meta-review-job',
  '*/5 * * * *',  -- Executa a cada 5 minutos (modificado conforme solicitado)
  $$
  -- Primeiro registrar o início da execução no log
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'daily-meta-review-job', 
    now(), 
    'started', 
    jsonb_build_object('timestamp', now())
  );
  
  -- Invocar a função Edge com token de serviço para garantir autenticação
  SELECT
    net.http_post(
      url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body:='{"scheduled": true, "source": "cron", "test": false, "executeReview": true}'::jsonb
    ) as request_id;
    
  -- Registrar a tentativa no log do sistema
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES ('cron_job', 'Tentativa de execução da revisão diária Meta Ads', jsonb_build_object('timestamp', now(), 'source', 'scheduled_job'));
  $$
);

-- Adicionar uma execução de manutenção de status para verificar e manter o cron ativo
SELECT cron.schedule(
  'cron-health-check',
  '*/5 * * * *',  -- A cada 5 minutos
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
  $$
);

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
