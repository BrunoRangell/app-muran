-- Atualizar cron job Meta Ads para processar TODAS as contas ativas (incluindo secundárias)
SELECT cron.alter_job(
  job_id := 30,
  schedule := '0 6,8,10,12,14,16,18,20,22 * * *',
  command := $$
    WITH active_meta_clients AS (
      SELECT jsonb_agg(c.id) as client_ids
      FROM public.clients c
      INNER JOIN public.client_accounts ca ON c.id = ca.client_id
      WHERE c.status = 'active'
      AND ca.platform = 'meta'
      AND ca.status = 'active'
    ),
    http_request AS (
      SELECT net.http_post(
        url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/unified-meta-review',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body := jsonb_build_object(
          'clientIds', amc.client_ids,
          'reviewDate', CURRENT_DATE::text
        )
      ) as request_id
      FROM active_meta_clients amc
    )
    INSERT INTO public.cron_execution_logs (job_name, status, details)
    SELECT 
      'meta-ads-batch-review-job',
      'completed',
      jsonb_build_object(
        'execution_time', now(),
        'request_id', hr.request_id,
        'source', 'cron_job'
      )
    FROM http_request hr;
  $$
);

-- Atualizar cron job Google Ads para processar TODAS as contas ativas (incluindo secundárias)
SELECT cron.alter_job(
  job_id := 33,
  schedule := '0 9,11,13,15,17,19,21,23 * * *',
  command := $$
    WITH active_google_clients AS (
      SELECT jsonb_agg(c.id) as client_ids
      FROM public.clients c
      INNER JOIN public.client_accounts ca ON c.id = ca.client_id
      WHERE c.status = 'active'
      AND ca.platform = 'google'
    ),
    http_request AS (
      SELECT net.http_post(
        url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-google-review',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
        body := jsonb_build_object(
          'clientIds', agc.client_ids,
          'source', 'automatic'
        )
      ) as request_id
      FROM active_google_clients agc
    )
    INSERT INTO public.cron_execution_logs (job_name, status, details)
    SELECT 
      'google-ads-batch-review-job',
      'completed',
      jsonb_build_object(
        'execution_time', now(),
        'request_id', hr.request_id,
        'source', 'cron_job'
      )
    FROM http_request hr;
  $$
);

-- Registrar log da correção
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job_update',
  'Cron jobs atualizados para processar contas secundárias',
  jsonb_build_object(
    'job_ids', ARRAY[30, 33],
    'job_names', ARRAY['meta-ads-batch-review-job', 'google-ads-batch-review-job'],
    'change', 'Removido filtro is_primary = true para processar todas as contas ativas',
    'impact', 'Agora processa contas primárias E secundárias',
    'updated_at', now()
  )
);