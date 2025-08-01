-- Criar função de limpeza manual para campaign_health
CREATE OR REPLACE FUNCTION public.manual_cleanup_campaign_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  deleted_old_count INTEGER;
  deleted_today_count INTEGER;
  result jsonb;
BEGIN
  -- Verificar se é admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas admins podem executar limpeza manual');
  END IF;

  -- 1. Remover dados anteriores a hoje
  DELETE FROM public.campaign_health 
  WHERE snapshot_date < CURRENT_DATE;
  
  GET DIAGNOSTICS deleted_old_count = ROW_COUNT;

  -- 2. Remover dados duplicados de hoje
  DELETE FROM public.campaign_health 
  WHERE snapshot_date = CURRENT_DATE;
  
  GET DIAGNOSTICS deleted_today_count = ROW_COUNT;

  -- Preparar resultado
  result := jsonb_build_object(
    'success', true,
    'deleted_old_records', deleted_old_count,
    'deleted_today_records', deleted_today_count,
    'cleanup_date', CURRENT_DATE,
    'timestamp', now()
  );

  -- Log da operação
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES (
    'manual_cleanup', 
    'Limpeza manual de campaign_health executada',
    result
  );

  RETURN result;
END;
$function$;

-- Criar função para monitorar o status da limpeza
CREATE OR REPLACE FUNCTION public.get_campaign_health_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result jsonb;
  total_records INTEGER;
  unique_dates INTEGER;
  oldest_date DATE;
  newest_date DATE;
BEGIN
  -- Verificar se é membro da equipe
  IF NOT is_team_member() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Coletar estatísticas
  SELECT 
    COUNT(*),
    COUNT(DISTINCT snapshot_date),
    MIN(snapshot_date),
    MAX(snapshot_date)
  INTO total_records, unique_dates, oldest_date, newest_date
  FROM public.campaign_health;

  result := jsonb_build_object(
    'success', true,
    'total_records', total_records,
    'unique_dates', unique_dates,
    'oldest_date', oldest_date,
    'newest_date', newest_date,
    'current_date', CURRENT_DATE,
    'has_old_data', (oldest_date < CURRENT_DATE),
    'timestamp', now()
  );

  RETURN result;
END;
$function$;