-- Criar CRON job para revisões automáticas do Google Ads
-- Executa a cada 2 horas nos mesmos horários do Meta Ads

SELECT cron.schedule(
  'google-ads-batch-review-job',
  '0 9,11,13,15,17,19,21,23 * * *',
  $$
  WITH active_google_clients AS (
    SELECT 
      id,
      google_account_id,
      name
    FROM public.clients
    WHERE status = 'active'
    AND google_account_id IS NOT NULL
    AND google_account_id != ''
  )
  SELECT
    net.http_post(
      url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-google-review',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw'
      ),
      body := jsonb_build_object(
        'clientId', agc.id::text,
        'googleAccountId', agc.google_account_id
      )
    ) AS request_id
  FROM active_google_clients agc;
  $$
);

-- Registrar criação do job no log
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job_created',
  'CRON job de revisão automática do Google Ads criado com sucesso',
  jsonb_build_object(
    'job_name', 'google-ads-batch-review-job',
    'schedule', '0 9,11,13,15,17,19,21,23 * * *',
    'description', 'Executa revisões automáticas para todos os clientes Google Ads ativos a cada 2 horas',
    'edge_function', 'daily-google-review',
    'created_at', now()
  )
);