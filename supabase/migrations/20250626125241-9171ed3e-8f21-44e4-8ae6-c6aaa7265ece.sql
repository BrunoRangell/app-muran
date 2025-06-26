
-- Adicionar campos para controlar avisos ignorados na tabela daily_budget_reviews
ALTER TABLE public.daily_budget_reviews 
ADD COLUMN warning_ignored_today boolean DEFAULT false,
ADD COLUMN warning_ignored_date date;

-- Criar índice para melhorar performance das consultas por data
CREATE INDEX idx_daily_budget_reviews_warning_ignored 
ON public.daily_budget_reviews (client_id, warning_ignored_date, warning_ignored_today);
