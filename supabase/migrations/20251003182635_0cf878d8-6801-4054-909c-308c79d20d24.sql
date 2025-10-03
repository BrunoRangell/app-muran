-- Remove política permissiva atual
DROP POLICY IF EXISTS "Team members can manage payments" ON public.payments;

-- Criar política para visualização (todos os team members)
CREATE POLICY "Team members can view payments"
ON public.payments
FOR SELECT
TO authenticated
USING (is_team_member());

-- Criar política para gerenciamento (apenas admins)
CREATE POLICY "Admins can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());