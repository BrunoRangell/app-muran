-- Criar um cron job simples de teste que executa a cada minuto
SELECT cron.schedule(
  'test-cron-job',
  '* * * * *', -- executa a cada minuto
  $$
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'cron_test', 
    'Cron job de teste executado com sucesso',
    jsonb_build_object(
      'timestamp', now(),
      'job_name', 'test-cron-job',
      'test_number', (
        SELECT COALESCE(COUNT(*), 0) + 1 
        FROM public.system_logs 
        WHERE event_type = 'cron_test'
      )
    )
  );
  $$
);