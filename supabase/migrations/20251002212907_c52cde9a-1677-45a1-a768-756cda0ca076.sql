-- PHASE 2: ROBUST ROLE SYSTEM
-- Implementa sistema de roles seguro com proteção contra privilege escalation

-- ============================================
-- 1. CREATE ROLE ENUM AND USER_ROLES TABLE
-- ============================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create user_roles table (separate from team_members for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ============================================
-- 2. CREATE AUDIT TABLE FOR ROLE CHANGES
-- ============================================

CREATE TABLE public.role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  action TEXT NOT NULL, -- 'granted' or 'revoked'
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE SECURE ROLE CHECK FUNCTIONS
-- ============================================

-- Replace is_admin() to use new role system
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Replace is_team_member() to use new role system
CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'member')
  );
$$;

-- Create has_role() function for flexible role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- ============================================
-- 4. CREATE RLS POLICIES FOR USER_ROLES
-- ============================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (is_admin());

-- Only admins can grant roles
CREATE POLICY "Only admins can grant roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can revoke roles
CREATE POLICY "Only admins can revoke roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (is_admin());

-- Prevent role updates (must delete and recreate)
-- This prevents accidental privilege changes

-- ============================================
-- 5. CREATE RLS POLICIES FOR AUDIT LOG
-- ============================================

CREATE POLICY "Admins can view audit log"
ON public.role_audit_log FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "System can insert audit log"
ON public.role_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- 6. CREATE AUDIT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, role, action, performed_by, details)
    VALUES (NEW.user_id, NEW.role, 'granted', auth.uid(), jsonb_build_object('granted_by', NEW.granted_by));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, role, action, performed_by, details)
    VALUES (OLD.user_id, OLD.role, 'revoked', auth.uid(), jsonb_build_object('role_id', OLD.id));
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER audit_user_roles
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_role_changes();

-- ============================================
-- 7. MIGRATE EXISTING ROLES
-- ============================================

-- Migrate existing permissions from team_members to user_roles
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  manager_id as user_id,
  CASE 
    WHEN permission = 'admin' THEN 'admin'::public.app_role
    ELSE 'member'::public.app_role
  END as role,
  NULL as granted_by -- Migration, no granter
FROM public.team_members
WHERE manager_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Log the migration
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'security_upgrade',
  'Migrated roles from team_members.permission to user_roles table',
  jsonb_build_object(
    'phase', 'phase_2_role_system',
    'timestamp', now(),
    'migrated_count', (SELECT COUNT(*) FROM public.user_roles)
  )
);