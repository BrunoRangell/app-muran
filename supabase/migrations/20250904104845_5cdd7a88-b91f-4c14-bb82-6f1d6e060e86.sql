-- Configurar cron job para horários comerciais brasileiros
-- Horários: 6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h (Brasil) = 9h, 11h, 13h, 15h, 17h, 19h, 21h, 23h (UTC)

-- Remover job atual
SELECT cron.unschedule('meta-ads-batch-review-job');

-- Criar novo cron job com horários comerciais brasileiros
SELECT cron.schedule(
  'meta-ads-batch-review-job',
  '0 9,11,13,15,17,19,21,23 * * *', -- executa às 6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h no Brasil
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
        'schedule', '0 9,11,13,15,17,19,21,23 * * *',
        'brazil_times', '6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h'
      )
    FROM http_request hr, active_clients ac
    RETURNING id
  )
  INSERT INTO public.system_logs (event_type, message, details)
  SELECT 
    'batch_review_completed',
    'Revisão em lote Meta Ads executada automaticamente (horários comerciais brasileiros)',
    jsonb_build_object(
      'platform', 'meta',
      'total_clients', jsonb_array_length(ac.client_ids),
      'execution_timestamp', now(),
      'source', 'automatic',
      'request_id', hr.request_id,
      'schedule', '0 9,11,13,15,17,19,21,23 * * *',
      'brazil_schedule', '6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h',
      'timezone', 'Brazil/Sao_Paulo (UTC-3)'
    )
  FROM http_request hr, active_clients ac, cron_log cl;
  $$
);

-- Log da configuração para horários comerciais brasileiros
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_brazil_schedule', 
  'Cron job configurado para horários comerciais brasileiros',
  jsonb_build_object(
    'timestamp', now(),
    'old_schedule', '0 */2 * * *',
    'new_schedule', '0 9,11,13,15,17,19,21,23 * * *',
    'brazil_times', '6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h',
    'utc_times', '9h, 11h, 13h, 15h, 17h, 19h, 21h, 23h',
    'timezone', 'America/Sao_Paulo (UTC-3)',
    'executions_per_day', 8,
    'reduction_percentage', '33.3%',
    'benefits', ARRAY[
      'Execuções apenas em horário comercial brasileiro',
      'Pausa noturna para manutenção (20h-6h)',
      'Redução de 33% nas execuções (8 vs 12 por dia)',
      'Melhor alinhamento com atividade comercial'
    ]
  )
);