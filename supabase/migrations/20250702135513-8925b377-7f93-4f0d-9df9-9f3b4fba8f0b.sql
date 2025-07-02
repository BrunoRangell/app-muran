
-- Limpar logs antigos (manter apenas os últimos 7 dias)
DELETE FROM public.system_logs 
WHERE created_at < (now() - INTERVAL '7 days');

-- Limpar logs de execução do cron antigos (manter apenas os últimos 3 dias)
DELETE FROM public.cron_execution_logs 
WHERE execution_time < (now() - INTERVAL '3 days');

-- Criar função para limpeza automática de logs
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
  
  -- Log da limpeza
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'maintenance', 
    'Limpeza automática de logs executada',
    jsonb_build_object(
      'timestamp', now(),
      'retention_system_logs', '7 days',
      'retention_cron_logs', '3 days'
    )
  );
END;
$$;

-- Agendar limpeza automática diária às 2h da manhã
SELECT cron.schedule(
  'daily-log-cleanup',
  '0 2 * * *',  -- Todo dia às 2h da manhã
  'SELECT public.cleanup_old_logs();'
);

-- Registrar a configuração da rotação
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'maintenance', 
  'Sistema de rotação automática de logs configurado',
  jsonb_build_object(
    'timestamp', now(),
    'schedule', 'daily at 2am',
    'system_logs_retention', '7 days',
    'cron_logs_retention', '3 days'
  )
);
