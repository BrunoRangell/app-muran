ALTER TABLE budget_reviews 
  DROP CONSTRAINT budget_reviews_custom_budget_id_fkey;

ALTER TABLE budget_reviews 
  ADD CONSTRAINT budget_reviews_custom_budget_id_fkey 
  FOREIGN KEY (custom_budget_id) 
  REFERENCES custom_budgets(id) 
  ON DELETE SET NULL;