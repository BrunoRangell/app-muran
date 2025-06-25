
-- Adicionar campos para controlar avisos ignorados na tabela google_ads_reviews
ALTER TABLE public.google_ads_reviews 
ADD COLUMN warning_ignored_today boolean DEFAULT false,
ADD COLUMN warning_ignored_date date;

-- Criar índice para melhorar performance das consultas por data
CREATE INDEX idx_google_ads_reviews_warning_ignored 
ON public.google_ads_reviews (client_id, warning_ignored_date, warning_ignored_today);
