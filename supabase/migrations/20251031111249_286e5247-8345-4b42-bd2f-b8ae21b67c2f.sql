-- Remover o CRON job incorreto
SELECT cron.unschedule('google-ads-batch-review-job');

-- Criar novo CRON job com SQL correto usando client_accounts
SELECT cron.schedule(
  'google-ads-batch-review-job',
  '0 9,11,13,15,17,19,21,23 * * *',
  $$
  WITH active_google_clients AS (
    SELECT 
      c.id,
      ca.account_id as google_account_id,
      c.company_name
    FROM public.clients c
    INNER JOIN public.client_accounts ca ON c.id = ca.client_id
    WHERE c.status = 'active'
    AND ca.platform = 'google'
    AND ca.is_primary = true
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

-- Registrar correção no log
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job_fixed',
  'CRON job Google Ads corrigido para usar client_accounts',
  jsonb_build_object(
    'old_job_id', 32,
    'issue', 'SQL usando coluna google_account_id que não existe mais na tabela clients',
    'solution', 'Atualizado para buscar de client_accounts com JOIN',
    'fixed_at', now()
  )
);