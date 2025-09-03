-- Remover job CRON da função google-ads-token-check que não existe mais
DELETE FROM cron.job WHERE jobname = 'google-ads-token-check-job';

-- Limpar logs de execução do job removido
DELETE FROM public.cron_execution_logs WHERE job_name = 'google-ads-token-check-job';

-- Log da limpeza
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'function_cleanup', 
  'Limpeza: Removido job CRON e logs da função google-ads-token-check',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'remove_ghost_function',
    'function_name', 'google-ads-token-check',
    'reason', 'Função não existe fisicamente'
  )
);