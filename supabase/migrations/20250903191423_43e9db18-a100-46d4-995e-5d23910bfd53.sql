-- Alterar cron job para execução a cada 2 horas
SELECT cron.unschedule('meta-ads-batch-review-job');

-- Criar novo cron job com execução a cada 2 horas (sempre no minuto 0)
SELECT cron.schedule(
  'meta-ads-batch-review-job',
  '0 */2 * * *', -- executa a cada 2 horas no minuto 0
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
  ),
  cron_log AS (
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    SELECT 
      'meta-ads-batch-review-job',
      now(),
      'completed',
      jsonb_build_object(
        'request_id', hr.request_id,
        'total_clients_processed', jsonb_array_length(ac.client_ids),
        'execution_timestamp', now(),
        'source', 'automatic',
        'schedule', '0 */2 * * *'
      )
    FROM http_request hr, active_clients ac
    RETURNING id
  )
  INSERT INTO public.system_logs (event_type, message, details)
  SELECT 
    'batch_review_completed',
    'Revisão em lote Meta Ads executada automaticamente (a cada 2 horas)',
    jsonb_build_object(
      'platform', 'meta',
      'total_clients', jsonb_array_length(ac.client_ids),
      'execution_timestamp', now(),
      'source', 'automatic',
      'request_id', hr.request_id,
      'schedule', '0 */2 * * *',
      'optimization', 'reduced_frequency_for_efficiency'
    )
  FROM http_request hr, active_clients ac, cron_log cl;
  $$
);

-- Log da alteração no sistema
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_optimization', 
  'Cron job Meta Ads otimizado para execução a cada 2 horas',
  jsonb_build_object(
    'timestamp', now(),
    'old_schedule', '*/5 * * * *',
    'new_schedule', '0 */2 * * *',
    'frequency_reduction', '95.8%',
    'benefits', ARRAY[
      'Eliminação de sobreposições',
      'Redução significativa de processamento',
      'Melhor gestão de recursos da API',
      'Sistema mais estável'
    ]
  )
);