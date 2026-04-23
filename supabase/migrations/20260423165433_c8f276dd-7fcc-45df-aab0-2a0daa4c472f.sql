CREATE OR REPLACE FUNCTION public.get_portal_client_data(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_portal record;
  v_accounts jsonb;
BEGIN
  -- Buscar portal ativo + cliente
  SELECT cp.id as portal_id,
         cp.client_id,
         cp.is_active,
         cp.default_platform,
         cp.default_period,
         cp.allow_period_change,
         cp.allow_platform_change,
         c.company_name,
         c.logo_url
    INTO v_portal
  FROM public.client_portals cp
  JOIN public.clients c ON c.id = cp.client_id
  WHERE cp.access_token = _token
    AND cp.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Portal não encontrado ou inativo');
  END IF;

  -- Buscar contas ativas do cliente
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ca.id,
        'account_id', ca.account_id,
        'account_name', ca.account_name,
        'platform', ca.platform,
        'status', ca.status,
        'is_primary', ca.is_primary,
        'created_at', ca.created_at
      )
      ORDER BY ca.is_primary DESC, ca.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_accounts
  FROM public.client_accounts ca
  WHERE ca.client_id = v_portal.client_id
    AND ca.status = 'active';

  RETURN jsonb_build_object(
    'client', jsonb_build_object(
      'id', v_portal.client_id,
      'company_name', v_portal.company_name,
      'logo_url', v_portal.logo_url
    ),
    'portal', jsonb_build_object(
      'id', v_portal.portal_id,
      'default_platform', v_portal.default_platform,
      'default_period', v_portal.default_period,
      'allow_period_change', v_portal.allow_period_change,
      'allow_platform_change', v_portal.allow_platform_change
    ),
    'accounts', v_accounts
  );
END;
$$;

-- Permitir execução pública (visitantes do portal sem login)
GRANT EXECUTE ON FUNCTION public.get_portal_client_data(text) TO anon, authenticated;