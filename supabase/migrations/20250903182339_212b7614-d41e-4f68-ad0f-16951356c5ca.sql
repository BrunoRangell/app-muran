-- Remover o cron job de teste anterior
SELECT cron.unschedule('test-cron-job');

-- Criar cron job de revisão em lote Meta Ads (executa a cada 5 minutos)
SELECT cron.schedule(
  'meta-ads-batch-review-job',
  '*/5 * * * *', -- executa a cada 5 minutos
  $$
  DO $$
  DECLARE
    active_clients_json jsonb;
    http_response jsonb;
  BEGIN
    -- Buscar todos os clientes ativos como array de UUIDs
    SELECT jsonb_agg(id) INTO active_clients_json
    FROM public.clients 
    WHERE status = 'active';
    
    -- Log do início da execução
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'meta-ads-batch-review-job',
      now(),
      'started',
      jsonb_build_object(
        'total_clients', jsonb_array_length(active_clients_json),
        'client_ids', active_clients_json
      )
    );
    
    -- Chamar a função unified-meta-review com todos os clientes
    SELECT net.http_post(
      url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/unified-meta-review',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw'
      ),
      body := jsonb_build_object(
        'clientIds', active_clients_json,
        'reviewDate', CURRENT_DATE::text
      )
    ) INTO http_response;
    
    -- Log do resultado da execução
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'meta-ads-batch-review-job',
      now(),
      CASE 
        WHEN (http_response->>'status_code')::int BETWEEN 200 AND 299 THEN 'completed'
        ELSE 'failed'
      END,
      jsonb_build_object(
        'http_status', http_response->>'status_code',
        'response_body', http_response->'body',
        'total_clients_processed', jsonb_array_length(active_clients_json),
        'execution_timestamp', now()
      )
    );
    
    -- Log no sistema também
    INSERT INTO public.system_logs (event_type, message, details)
    VALUES (
      'cron_batch_review',
      'Revisão em lote Meta Ads executada automaticamente',
      jsonb_build_object(
        'job_name', 'meta-ads-batch-review-job',
        'clients_count', jsonb_array_length(active_clients_json),
        'http_status', http_response->>'status_code',
        'timestamp', now()
      )
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log de erro em caso de falha
    INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
    VALUES (
      'meta-ads-batch-review-job',
      now(),
      'error',
      jsonb_build_object(
        'error_message', SQLERRM,
        'error_code', SQLSTATE,
        'timestamp', now()
      )
    );
  END $$;
  $$
);