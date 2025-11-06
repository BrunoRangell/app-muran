-- Atualizar CRON job do Google Ads para processamento em lote
-- Este script modifica o job existente (jobid=33) para coletar todos os clientIds
-- e fazer UMA única chamada HTTP para a Edge Function

-- Atualizar comando do CRON job existente
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
      AND ca.is_primary = true
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
      WHERE agc.client_ids IS NOT NULL AND jsonb_array_length(agc.client_ids) > 0
    ),
    cron_log AS (
      INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
      SELECT 
        'google-ads-batch-review-job',
        now(),
        CASE 
          WHEN hr.request_id IS NOT NULL THEN 'completed'
          ELSE 'skipped'
        END,
        jsonb_build_object(
          'request_id', hr.request_id,
          'total_clients_processed', COALESCE(jsonb_array_length(agc.client_ids), 0),
          'execution_timestamp', now(),
          'source', 'automatic',
          'cron_schedule', '0 9,11,13,15,17,19,21,23 * * *'
        )
      FROM active_google_clients agc
      LEFT JOIN http_request hr ON true
      RETURNING id
    )
    SELECT 
      COALESCE(hr.request_id, 0) as request_id,
      jsonb_array_length(agc.client_ids) as clients_processed
    FROM active_google_clients agc
    LEFT JOIN http_request hr ON true;
  $$
);

-- Registrar log de atualização
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job_update',
  'CRON job Google Ads atualizado para processamento em lote',
  jsonb_build_object(
    'job_id', 33,
    'job_name', 'google-ads-batch-review-job',
    'schedule', '0 9,11,13,15,17,19,21,23 * * * (a cada 2 horas)',
    'mode', 'batch_processing',
    'updated_at', now(),
    'description', 'Agora coleta todos os clientIds e faz UMA única chamada HTTP'
  )
);