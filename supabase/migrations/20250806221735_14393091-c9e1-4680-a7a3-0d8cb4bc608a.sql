-- Restaurar políticas RLS seguras após consolidação do cliente Supabase

-- Restaurar política segura para payments
DROP POLICY IF EXISTS "Temporary allow all payments access" ON payments;
CREATE POLICY "Team members can manage payments" ON payments 
FOR ALL 
USING (is_team_member()) 
WITH CHECK (is_team_member());

-- Restaurar política segura para costs  
DROP POLICY IF EXISTS "Temporary allow all costs access" ON costs;
CREATE POLICY "Team members can manage costs" ON costs 
FOR ALL 
USING (is_team_member()) 
WITH CHECK (is_team_member());

-- Restaurar política segura para budget_reviews
DROP POLICY IF EXISTS "Temporary allow all budget reviews access" ON budget_reviews;
CREATE POLICY "Team members can manage budget reviews" ON budget_reviews 
FOR ALL 
USING (is_team_member()) 
WITH CHECK (is_team_member());

-- Restaurar política segura para custom_budgets
DROP POLICY IF EXISTS "Temporary allow all custom budgets access" ON custom_budgets;
CREATE POLICY "Team members can manage custom budgets" ON custom_budgets 
FOR ALL 
USING (is_team_member()) 
WITH CHECK (is_team_member());

-- Comentários indicando que são as políticas finais seguras
COMMENT ON POLICY "Team members can manage payments" ON payments IS 'Secure policy - Only team members can access payments';
COMMENT ON POLICY "Team members can manage costs" ON costs IS 'Secure policy - Only team members can access costs';
COMMENT ON POLICY "Team members can manage budget reviews" ON budget_reviews IS 'Secure policy - Only team members can access budget reviews';
COMMENT ON POLICY "Team members can manage custom budgets" ON custom_budgets IS 'Secure policy - Only team members can access custom budgets';