-- Função para detectar se está sendo executada com SERVICE_ROLE_KEY
CREATE OR REPLACE FUNCTION public.is_service_role_execution()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Detecta se está sendo executada com privilégios de SERVICE_ROLE
  -- Verifica se current_setting pode acessar configurações administrativas
  SELECT CASE 
    WHEN current_setting('request.jwt.claims', true) IS NULL THEN true
    WHEN current_setting('role') = 'service_role' THEN true
    ELSE false
  END;
$$;

-- Atualizar a função de limpeza manual para aceitar SERVICE_ROLE
CREATE OR REPLACE FUNCTION public.manual_cleanup_campaign_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_old_count INTEGER;
  deleted_today_count INTEGER;
  result jsonb;
  is_authorized boolean := false;
BEGIN
  -- Verificar autorização: admin user OU service_role execution
  IF is_service_role_execution() THEN
    is_authorized := true;
  ELSIF is_admin() THEN
    is_authorized := true;
  END IF;

  IF NOT is_authorized THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Acesso negado. Apenas admins ou execução automática podem executar limpeza manual',
      'context', jsonb_build_object(
        'is_service_role', is_service_role_execution(),
        'is_admin', is_admin(),
        'auth_uid', auth.uid()
      )
    );
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
    'timestamp', now(),
    'execution_context', CASE 
      WHEN is_service_role_execution() THEN 'service_role'
      WHEN is_admin() THEN 'admin_user'
      ELSE 'unknown'
    END
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
$$;