-- Fix critical security vulnerability in campaign_health table
-- Remove overly permissive policies and implement proper access control

-- Drop all existing permissive policies
DROP POLICY IF EXISTS "Service role can manage all campaign health data" ON public.campaign_health;
DROP POLICY IF EXISTS "Authenticated users can insert/update campaign health" ON public.campaign_health;
DROP POLICY IF EXISTS "Authenticated users can update campaign health" ON public.campaign_health;
DROP POLICY IF EXISTS "Allow DELETE for data cleanup" ON public.campaign_health;

-- Keep the secure SELECT policy for team members (already exists)
-- "Team members can view campaign health" - this one stays as is

-- Add secure INSERT policy: Only service role (edge functions) can insert
CREATE POLICY "Service role can insert campaign health"
ON public.campaign_health
FOR INSERT
WITH CHECK (is_service_role_execution());

-- Add secure UPDATE policy: Only service role (edge functions) can update
CREATE POLICY "Service role can update campaign health"
ON public.campaign_health
FOR UPDATE
USING (is_service_role_execution())
WITH CHECK (is_service_role_execution());

-- Add secure DELETE policy: Only admin or service role can delete (for cleanup)
CREATE POLICY "Admin or service role can delete campaign health"
ON public.campaign_health
FOR DELETE
USING (is_admin() OR is_service_role_execution());