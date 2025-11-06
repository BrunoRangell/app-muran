-- Corrigir filtro de clientes no CRON Meta Ads
-- Alinhar com a lógica do Google que só envia clientes com contas ativas

SELECT cron.alter_job(
  job_id := 30,
  command := $$
    WITH active_meta_clients AS (
      SELECT jsonb_agg(c.id) as client_ids
      FROM public.clients c
      INNER JOIN public.client_accounts ca ON c.id = ca.client_id
      WHERE c.status = 'active'
      AND ca.platform = 'meta'
      AND ca.status = 'active'
      AND ca.is_primary = true
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
      WHERE amc.client_ids IS NOT NULL AND jsonb_array_length(amc.client_ids) > 0
    ),
    cron_log AS (
      INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
      SELECT 
        'meta-ads-batch-review-job',
        now(),
        CASE 
          WHEN hr.request_id IS NOT NULL THEN 'completed'
          ELSE 'skipped'
        END,
        jsonb_build_object(
          'request_id', hr.request_id,
          'total_clients_processed', COALESCE(jsonb_array_length(amc.client_ids), 0),
          'execution_timestamp', now(),
          'source', 'automatic',
          'schedule', '0 9,11,13,15,17,19,21,23 * * *',
          'brazil_times', '6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h'
        )
      FROM active_meta_clients amc
      LEFT JOIN http_request hr ON true
      RETURNING id
    )
    INSERT INTO public.system_logs (event_type, message, details)
    SELECT 
      'batch_review_completed',
      'Revisão em lote Meta Ads executada automaticamente (horários comerciais brasileiros)',
      jsonb_build_object(
        'platform', 'meta',
        'total_clients', COALESCE(jsonb_array_length(amc.client_ids), 0),
        'execution_timestamp', now(),
        'source', 'automatic',
        'request_id', hr.request_id,
        'schedule', '0 9,11,13,15,17,19,21,23 * * *',
        'brazil_schedule', '6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h',
        'timezone', 'Brazil/Sao_Paulo (UTC-3)'
      )
    FROM active_meta_clients amc
    LEFT JOIN http_request hr ON true, cron_log cl;
  $$
);

-- Registrar log da correção
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'cron_job_fix',
  'CRON Meta Ads corrigido - agora filtra apenas clientes com contas Meta ativas',
  jsonb_build_object(
    'job_id', 30,
    'job_name', 'meta-ads-batch-review-job',
    'issue', 'Enviava 31 clientes mas só 18 tinham conta Meta ativa',
    'fix', 'Adicionado filtro: ca.platform = meta AND ca.status = active AND ca.is_primary = true',
    'expected_clients_after_fix', 18,
    'aligned_with', 'google-ads-batch-review-job (jobid 33)',
    'fixed_at', now()
  )
);