-- Fix critical security vulnerabilities in team_members and clients tables
-- Remove overly permissive policies and implement proper access control

-- ============================================
-- FIX 1: team_members table - Remove public access
-- ============================================

-- First, check if there's a misapplied policy (the error mentions "Permitir leitura pública dos emblemas")
-- This should be on badges table, not team_members
-- We'll drop any overly permissive policies

-- Note: The secure policies we want to keep are:
-- - "Admins can manage team members" (is_admin)
-- - "Team members can view team data" (is_team_member)
-- - "Team members can update own profile" (manager_id = auth.uid())
-- - "Users can insert their own team member record" (auth.uid() = manager_id)

-- If there's any public read policy, it needs to be removed
-- Since we can't query to check, we'll create a comprehensive security fix

-- Drop and recreate all policies to ensure clean state
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team data" ON public.team_members;
DROP POLICY IF EXISTS "Team members can update own profile" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert their own team member record" ON public.team_members;
DROP POLICY IF EXISTS "Permitir leitura pública dos emblemas" ON public.team_members;

-- Recreate secure policies
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Team members can view team data"
ON public.team_members
FOR SELECT
USING (is_team_member());

CREATE POLICY "Team members can update own profile"
ON public.team_members
FOR UPDATE
USING (manager_id = auth.uid())
WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can insert their own team member record"
ON public.team_members
FOR INSERT
WITH CHECK (auth.uid() = manager_id);

-- ============================================
-- FIX 2: clients table - Remove public access
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can access clients" ON public.clients;
DROP POLICY IF EXISTS "Team members only can access clients" ON public.clients;

-- Recreate only the secure team members policy
CREATE POLICY "Team members only can access clients"
ON public.clients
FOR ALL
USING (is_team_member())
WITH CHECK (is_team_member());

-- ============================================
-- FIX 3: client_accounts table - Same issue as clients
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can access client accounts" ON public.client_accounts;
DROP POLICY IF EXISTS "Team members only can access client accounts" ON public.client_accounts;

-- Recreate only the secure team members policy
CREATE POLICY "Team members only can access client accounts"
ON public.client_accounts
FOR ALL
USING (is_team_member())
WITH CHECK (is_team_member());