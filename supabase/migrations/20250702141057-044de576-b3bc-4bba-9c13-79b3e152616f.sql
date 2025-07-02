
-- PASSO 1: REMOVER COMPLETAMENTE O JOB DAILY-META-REVIEW-JOB
SELECT cron.unschedule('daily-meta-review-job');
SELECT cron.unschedule('daily-meta-review-test-job');

-- PASSO 2: LIMPEZA MASSIVA DOS LOGS DO CRON (LIBERAR ~420MB)
-- Limpar a tabela cron.job_run_details que está causando o problema de espaço
DELETE FROM cron.job_run_details 
WHERE job_id IN (
  SELECT jobid FROM cron.job 
  WHERE jobname IN ('daily-meta-review-job', 'daily-meta-review-test-job')
) OR created_at < (now() - INTERVAL '7 days');

-- Limpar logs relacionados nas nossas tabelas customizadas
DELETE FROM public.cron_execution_logs 
WHERE job_name IN ('daily-meta-review-job', 'daily-meta-review-test-job')
   OR execution_time < (now() - INTERVAL '3 days');

DELETE FROM public.system_logs 
WHERE event_type = 'cron_job' 
  AND (details->>'job' IN ('daily-meta-review-job', 'daily-meta-review-test-job')
       OR created_at < (now() - INTERVAL '7 days'));

-- PASSO 3: ATUALIZAR A FUNÇÃO DE LIMPEZA AUTOMÁTICA PARA INCLUIR CRON LOGS
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpar system_logs com mais de 7 dias
  DELETE FROM public.system_logs 
  WHERE created_at < (now() - INTERVAL '7 days');
  
  -- Limpar cron_execution_logs com mais de 3 dias
  DELETE FROM public.cron_execution_logs 
  WHERE execution_time < (now() - INTERVAL '3 days');
  
  -- NOVO: Limpar logs nativos do cron (cron.job_run_details) com mais de 3 dias
  DELETE FROM cron.job_run_details 
  WHERE started_at < (now() - INTERVAL '3 days');
  
  -- Log da limpeza com informações sobre quantos registros foram removidos
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'maintenance', 
    'Limpeza automática de logs executada - incluindo cron.job_run_details',
    jsonb_build_object(
      'timestamp', now(),
      'retention_system_logs', '7 days',
      'retention_cron_logs', '3 days',
      'retention_cron_native_logs', '3 days'
    )
  );
END;
$$;

-- PASSO 4: OTIMIZAR FREQUÊNCIAS DOS JOBS RESTANTES
-- Reduzir frequência do cron-health-check de 30min para 1 hora
SELECT cron.unschedule('cron-health-check');
SELECT cron.schedule(
  'cron-health-check',
  '0 * * * *',  -- A cada hora em vez de 30 minutos
  $$
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'cron-health-check', 
    now(), 
    'active', 
    jsonb_build_object(
      'timestamp', now(),
      'message', 'Verificação de saúde do cron - frequência otimizada'
    )
  );
  
  -- Executar limpeza automática durante o health check
  SELECT public.cleanup_old_logs();
  $$
);

-- Manter apenas o google-ads-token-check-job com frequência de 2 horas (que é adequada)
-- Este job permanece porque é útil para renovação de tokens Google

-- PASSO 5: REGISTRAR A REMOÇÃO E OTIMIZAÇÃO
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'maintenance', 
  'REMOÇÃO COMPLETA DOS JOBS DE REVISÃO META ADS E OTIMIZAÇÃO DO SISTEMA',
  jsonb_build_object(
    'timestamp', now(),
    'removed_jobs', ARRAY['daily-meta-review-job', 'daily-meta-review-test-job'],
    'reason', 'Jobs inúteis gerando 425MB de logs desnecessários',
    'expected_space_freed', '~420MB',
    'optimized_jobs', jsonb_build_object(
      'cron-health-check', 'reduzido de 30min para 1 hora',
      'google-ads-token-check-job', 'mantido (útil para tokens Google)'
    ),
    'cleanup_enhanced', 'Função de limpeza agora inclui cron.job_run_details'
  )
);

-- Executar limpeza imediata após as mudanças
SELECT public.cleanup_old_logs();
