
-- MIGRATION URGENTE SIMPLIFICADA - REMOÇÃO DO SISTEMA DE RENOVAÇÃO AUTOMÁTICA DE TOKENS GOOGLE ADS VIA CRON
-- A renovação agora é feita "on-demand" pela função `active-campaigns-health`

-- Limpar jobs antigos
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('google-ads-token-check-job');
    RAISE NOTICE 'Cron job "google-ads-token-check-job" removido.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cron job "google-ads-token-check-job" não encontrado ou já removido.';
  END;
  
  BEGIN
    PERFORM cron.unschedule('google-token-health-check');
    RAISE NOTICE 'Cron job "google-token-health-check" removido.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cron job "google-token-health-check" não encontrado ou já removido.';
  END;
  
  PERFORM pg_sleep(1);
END $$;

-- Registrar remoção da configuração antiga
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'token_renewal', 
  'SISTEMA DE RENOVAÇÃO DE TOKEN VIA CRON REMOVIDO', 
  jsonb_build_object(
    'timestamp', now(),
    'jobs_removed', ARRAY['google-ads-token-check-job', 'google-token-health-check'],
    'reason', 'A renovação agora é feita on-demand pela função `active-campaigns-health`.'
  )
);
