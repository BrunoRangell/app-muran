
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

-- Remover job existente se houver
SELECT cron.unschedule('daily-meta-review-job');
SELECT cron.unschedule('cron-health-check');
SELECT cron.unschedule('cron-status-keeper');

-- Criar job para executar revisão Meta Ads às 16:00
SELECT cron.schedule(
  'daily-meta-review-job',
  '0 16 * * *',  -- Executa às 16:00 todos os dias
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
    
  -- Registrar a tentativa no log do sistema
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES ('cron_job', 'Tentativa de execução da revisão diária Meta Ads', json_build_object('timestamp', now()));
  $$
);

-- Adicionar job para verificação de saúde do sistema de cron
SELECT cron.schedule(
  'cron-health-check',
  '0 */1 * * *',  -- Executa a cada hora
  $$
  -- Obter o timestamp da última revisão
  WITH last_review AS (
    SELECT value FROM system_configs WHERE key = 'last_batch_review_time'
  )
  
  -- Registrar verificação de saúde
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES ('cron_job', 'Verificação periódica de saúde do sistema de cron', json_build_object(
    'timestamp', now(),
    'last_meta_review', (SELECT value FROM last_review)
  ));
  
  -- Se não houver execução recente (nas últimas 24 horas), registrar alerta
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  SELECT 
    'cron-health-check', 
    now(), 
    CASE 
      WHEN value IS NULL OR (value::timestamptz) < (now() - interval '24 hours') THEN 'warning'
      ELSE 'active'
    END,
    jsonb_build_object(
      'message', CASE 
        WHEN value IS NULL OR (value::timestamptz) < (now() - interval '24 hours') 
        THEN 'Nenhuma execução recente encontrada' 
        ELSE 'Sistema funcionando normalmente'
      END,
      'last_review', value,
      'hours_since_last', EXTRACT(EPOCH FROM (now() - COALESCE(value::timestamptz, now() - interval '48 hours'))) / 3600
    )
  FROM last_review;
  $$
);

-- Job adicional para manter o status de ativo adicionando logs periódicos
SELECT cron.schedule(
  'cron-status-keeper',
  '*/15 * * * *',  -- Executa a cada 15 minutos (mais frequente para testes)
  $$
  -- Verificar se houve execução nas últimas 24 horas
  WITH last_execution AS (
    SELECT execution_time 
    FROM cron_execution_logs
    WHERE job_name = 'daily-meta-review-job'
      AND status IN ('success', 'partial_success', 'test_success', 'started')
    ORDER BY execution_time DESC
    LIMIT 1
  ),
  last_status AS (
    SELECT 
      CASE 
        WHEN EXISTS (SELECT 1 FROM last_execution WHERE execution_time > (now() - interval '24 hours'))
        THEN 'active'
        ELSE 'unknown'
      END AS status
  )
  
  -- Inserir log de status
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  SELECT
    'cron-status-keeper', 
    now(), 
    status,
    jsonb_build_object(
      'message', 'Verificação periódica de status do cron',
      'timestamp', now(),
      'auto_generated', true
    )
  FROM last_status;
  
  -- Inserir também no system_logs para maior visibilidade
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'cron_job',
    'Heartbeat periódico do sistema cron',
    jsonb_build_object(
      'timestamp', now(),
      'auto_generated', true
    )
  );
  $$
);
