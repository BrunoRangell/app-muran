
-- Adicionar constraint única que permite múltiplas contas por cliente/data
-- Primeiro, remover a constraint existente se existir
ALTER TABLE public.daily_budget_reviews DROP CONSTRAINT IF EXISTS daily_budget_reviews_client_id_review_date_key;

-- Criar nova constraint única que inclui meta_account_id
ALTER TABLE public.daily_budget_reviews 
ADD CONSTRAINT daily_budget_reviews_client_review_account_unique 
UNIQUE (client_id, review_date, meta_account_id);

-- Também vamos adicionar um índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_daily_budget_reviews_client_account_date 
ON public.daily_budget_reviews (client_id, meta_account_id, review_date DESC);
