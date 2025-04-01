
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

-- Remover job existente se houver
SELECT cron.unschedule('daily-meta-review-job');

-- Criar job para executar revisão Meta Ads todos os dias às 06:00
SELECT cron.schedule(
  'daily-meta-review-job',
  '0 6 * * *',  -- Executa às 6:00 todos os dias
  $$
  -- Primeiro registrar o início da execução no log
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'daily-meta-review-job', 
    now(), 
    'started', 
    jsonb_build_object('timestamp', now())
  );
  
  -- Invocar a função Edge
  SELECT
    net.http_post(
      url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
    
  -- Registrar a tentativa no log
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES ('cron_job', 'Tentativa de execução da revisão diária Meta Ads', json_build_object('timestamp', now()));
  $$
);

-- Adicionar job para verificação de saúde do sistema de cron
SELECT cron.schedule(
  'cron-health-check',
  '0 7 * * *',  -- Executa às 7:00 todos os dias (1 hora após a revisão)
  $$
  -- Obter o timestamp da última revisão
  WITH last_review AS (
    SELECT value FROM system_configs WHERE key = 'last_batch_review_time'
  )
  
  -- Registrar verificação de saúde
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES ('cron_health', 'Verificação diária de saúde do sistema de cron', json_build_object(
    'timestamp', now(),
    'last_meta_review', (SELECT value FROM last_review)
  ));
  
  -- Se não houver execução recente (nas últimas 24 horas), registrar alerta
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  SELECT 
    'cron-health-check', 
    now(), 
    'warning', 
    jsonb_build_object(
      'message', 'Nenhuma execução recente encontrada',
      'last_review', value,
      'hours_since_last', EXTRACT(EPOCH FROM (now() - (value::timestamptz))) / 3600
    )
  FROM last_review
  WHERE 
    value IS NULL OR 
    (value::timestamptz) < (now() - interval '24 hours');
  $$
);
