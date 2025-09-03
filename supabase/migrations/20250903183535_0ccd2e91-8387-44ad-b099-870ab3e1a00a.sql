-- Remover o cron job com erro
SELECT cron.unschedule('meta-ads-batch-review-job');

-- Criar cron job corrigido - versão simplificada
SELECT cron.schedule(
  'meta-ads-batch-review-job',
  '*/5 * * * *', -- executa a cada 5 minutos
  $$
  WITH active_clients AS (
    SELECT jsonb_agg(id) as client_ids
    FROM public.clients 
    WHERE status = 'active'
  ),
  http_request AS (
    SELECT net.http_post(
      url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/unified-meta-review',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body := jsonb_build_object(
        'clientIds', ac.client_ids,
        'reviewDate', CURRENT_DATE::text
      )
    ) as request_id
    FROM active_clients ac
  )
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  SELECT 
    'meta-ads-batch-review-job',
    now(),
    'completed',
    jsonb_build_object(
      'request_id', hr.request_id,
      'total_clients_processed', jsonb_array_length(ac.client_ids),
      'execution_timestamp', now(),
      'note', 'HTTP request sent successfully - response processing is asynchronous'
    )
  FROM http_request hr, active_clients ac;
  $$
);