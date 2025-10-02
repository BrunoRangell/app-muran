-- SECURITY FIX: Remove public access to team_members table
-- This prevents unauthorized access to employee personal information

-- Drop the public read policy that allows anyone to view team member data
DROP POLICY IF EXISTS "Permitir leitura pública de membros da equipe" ON public.team_members;

-- Drop the overly permissive authenticated policies
DROP POLICY IF EXISTS "Enable read access for authenticated users only" ON public.team_members;
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.team_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.team_members;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.team_members;

-- Create secure policies that require team membership
CREATE POLICY "Team members can view team data"
ON public.team_members
FOR SELECT
TO authenticated
USING (is_team_member());

CREATE POLICY "Team members can update own profile"
ON public.team_members
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid())
WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Note: The existing "Users can insert their own team member record" policy remains unchanged