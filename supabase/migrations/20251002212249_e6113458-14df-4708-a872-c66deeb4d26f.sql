-- PHASE 1: CRITICAL SECURITY FIXES
-- This migration addresses critical security vulnerabilities

-- ============================================
-- 1. SECURE CLIENT DATA TABLES
-- ============================================

-- Remove public access from clients table
DROP POLICY IF EXISTS "Allow anonymous access to clients" ON public.clients;

-- Create team-member-only access for clients
CREATE POLICY "Team members only can access clients"
ON public.clients FOR ALL
TO authenticated
USING (is_team_member())
WITH CHECK (is_team_member());

-- Remove public access from client_accounts table
DROP POLICY IF EXISTS "Allow anonymous access to client accounts" ON public.client_accounts;

-- Create team-member-only access for client_accounts
CREATE POLICY "Team members only can access client accounts"
ON public.client_accounts FOR ALL
TO authenticated
USING (is_team_member())
WITH CHECK (is_team_member());

-- Remove public access from campaign_health table
DROP POLICY IF EXISTS "Public can read campaign health" ON public.campaign_health;

-- Create team-member-only access for campaign_health (keep existing authenticated policies)
CREATE POLICY "Team members can view campaign health"
ON public.campaign_health FOR SELECT
TO authenticated
USING (is_team_member());

-- ============================================
-- 2. SECURE API TOKENS TABLE
-- ============================================

-- Remove all permissive policies on api_tokens
DROP POLICY IF EXISTS "Allow SELECT on api_tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Allow INSERT on api_tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Allow UPDATE on api_tokens" ON public.api_tokens;

-- Create admin-only access for API tokens
CREATE POLICY "Only admins can manage API tokens"
ON public.api_tokens FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================
-- 3. FIX BADGES TABLE CONFLICTS
-- ============================================

-- Remove old permissive policies that conflict with admin-only policies
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
DROP POLICY IF EXISTS "Authenticated users can create badges" ON public.badges;
DROP POLICY IF EXISTS "Authenticated users can update badges" ON public.badges;
DROP POLICY IF EXISTS "Authenticated users can delete badges" ON public.badges;

-- Keep only the secure admin-restricted policies:
-- "Permitir leitura pública dos emblemas" (public read is OK for badges display)
-- "Permitir inserção de emblemas apenas por admins"
-- "Permitir deleção de emblemas apenas por admins"