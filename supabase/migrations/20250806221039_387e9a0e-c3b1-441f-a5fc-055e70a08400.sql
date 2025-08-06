-- Políticas temporárias mais permissivas para resolver problema de auth.uid() = null

-- Política temporária para payments
DROP POLICY IF EXISTS "Team members can manage payments" ON payments;
CREATE POLICY "Temporary allow all payments access" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Política temporária para costs
DROP POLICY IF EXISTS "Team members can manage costs" ON costs;
CREATE POLICY "Temporary allow all costs access" ON costs FOR ALL USING (true) WITH CHECK (true);

-- Política temporária para budget_reviews
DROP POLICY IF EXISTS "Team members can manage budget reviews" ON budget_reviews;
CREATE POLICY "Temporary allow all budget reviews access" ON budget_reviews FOR ALL USING (true) WITH CHECK (true);

-- Política temporária para custom_budgets
DROP POLICY IF EXISTS "Team members can manage custom budgets" ON custom_budgets;
CREATE POLICY "Temporary allow all custom budgets access" ON custom_budgets FOR ALL USING (true) WITH CHECK (true);

-- Adicionar comentário indicando que são temporárias
COMMENT ON POLICY "Temporary allow all payments access" ON payments IS 'TEMPORARY POLICY - Remove after fixing auth.uid() issue';
COMMENT ON POLICY "Temporary allow all costs access" ON costs IS 'TEMPORARY POLICY - Remove after fixing auth.uid() issue';
COMMENT ON POLICY "Temporary allow all budget reviews access" ON budget_reviews IS 'TEMPORARY POLICY - Remove after fixing auth.uid() issue';
COMMENT ON POLICY "Temporary allow all custom budgets access" ON custom_budgets IS 'TEMPORARY POLICY - Remove after fixing auth.uid() issue';