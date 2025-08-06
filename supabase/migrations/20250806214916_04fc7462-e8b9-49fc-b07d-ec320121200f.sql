-- Fix function search path security warnings
-- All functions need SET search_path = public, extensions for security

CREATE OR REPLACE FUNCTION public.update_timestamp_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, extensions
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_daily_budget(budget_amount numeric, start_date date, end_date date)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path = public, extensions
AS $function$
DECLARE
  days_in_period INTEGER;
BEGIN
  -- Calcular dias no período (incluindo start_date e end_date)
  days_in_period := (end_date - start_date) + 1;
  
  -- Evitar divisão por zero
  IF days_in_period <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calcular orçamento diário
  RETURN budget_amount / days_in_period;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_custom_budget_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, extensions
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public, extensions
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_cron_expression(job_name text)
 RETURNS TABLE(cron_expression text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
  RETURN QUERY
  SELECT schedule
  FROM cron.job
  WHERE jobname = job_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_cron_jobs(job_names text[])
 RETURNS TABLE(jobid bigint, jobname text, schedule text, active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid::bigint, 
    j.jobname, 
    j.schedule, 
    j.active
  FROM 
    cron.job j
  WHERE 
    j.jobname = ANY(job_names);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  SELECT tm.permission
  FROM public.team_members tm
  WHERE tm.manager_id = auth.uid()
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_team_member()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.manager_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  SELECT COALESCE(
    (SELECT tm.permission = 'admin'
     FROM public.team_members tm
     WHERE tm.manager_id = auth.uid()
     LIMIT 1), 
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_campaign_health_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
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

CREATE OR REPLACE FUNCTION public.manual_cleanup_campaign_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.extract_transaction_pattern(description text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public, extensions
AS $function$
BEGIN
    -- Por enquanto vamos usar a descrição completa como padrão
    -- No futuro podemos implementar lógica mais sofisticada de extração de padrões
    RETURN description;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_service_role_execution()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  -- Detecta se está sendo executada com privilégios de SERVICE_ROLE
  -- Verifica se current_setting pode acessar configurações administrativas
  SELECT CASE 
    WHEN current_setting('request.jwt.claims', true) IS NULL THEN true
    WHEN current_setting('role') = 'service_role' THEN true
    ELSE false
  END;
$function$;

CREATE OR REPLACE FUNCTION public.update_daily_budget_review(p_id integer, p_meta_daily_budget_current numeric, p_meta_total_spent numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
  UPDATE public.daily_budget_reviews
  SET 
    meta_daily_budget_current = p_meta_daily_budget_current,
    meta_total_spent = p_meta_total_spent,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_daily_budget_review(p_client_id uuid, p_review_date date, p_meta_daily_budget_current numeric, p_meta_total_spent numeric, p_meta_account_id character varying, p_meta_account_name character varying)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  v_id INTEGER;
BEGIN
  INSERT INTO public.daily_budget_reviews (
    client_id,
    review_date,
    meta_daily_budget_current,
    meta_total_spent,
    meta_account_id,
    meta_account_name,
    created_at,
    updated_at
  )
  VALUES (
    p_client_id,
    p_review_date,
    p_meta_daily_budget_current,
    p_meta_total_spent,
    p_meta_account_id,
    p_meta_account_name,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.review_all_google_ads_clients()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Marcar todas as revisões para processamento
  WITH clients_to_review AS (
    SELECT id, google_account_id
    FROM public.clients
    WHERE status = 'active'
    AND google_account_id IS NOT NULL
    AND google_account_id != ''
  )
  INSERT INTO public.scheduled_tasks (id, task_name, schedule, config, is_active)
  VALUES (
    gen_random_uuid(),
    'review_google_ads_client',
    'immediately',
    jsonb_build_object('client_ids', (SELECT jsonb_agg(id) FROM clients_to_review)),
    true
  )
  RETURNING id INTO result;

  RETURN jsonb_build_object('success', true, 'task_id', result);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, extensions
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- Move pg_net extension from public to extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Log security improvements
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'security_update', 
  'Correções de segurança aplicadas: search_path das funções corrigido',
  jsonb_build_object(
    'timestamp', now(),
    'functions_updated', 17,
    'extensions_moved', ARRAY['pg_net'],
    'security_warnings_fixed', 18,
    'note', 'pg_graphql precisa ser atualizado manualmente pelo Supabase'
  )
);