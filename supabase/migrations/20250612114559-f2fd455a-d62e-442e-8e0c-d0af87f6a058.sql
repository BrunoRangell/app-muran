
-- Adicionar campos para armazenar gastos individuais dos últimos 5 dias na tabela google_ads_reviews
ALTER TABLE public.google_ads_reviews 
ADD COLUMN google_day_1_spent numeric DEFAULT 0,
ADD COLUMN google_day_2_spent numeric DEFAULT 0,
ADD COLUMN google_day_3_spent numeric DEFAULT 0,
ADD COLUMN google_day_4_spent numeric DEFAULT 0,
ADD COLUMN google_day_5_spent numeric DEFAULT 0;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.google_ads_reviews.google_day_1_spent IS 'Gasto do dia 1 (5 dias atrás)';
COMMENT ON COLUMN public.google_ads_reviews.google_day_2_spent IS 'Gasto do dia 2 (4 dias atrás)';
COMMENT ON COLUMN public.google_ads_reviews.google_day_3_spent IS 'Gasto do dia 3 (3 dias atrás)';
COMMENT ON COLUMN public.google_ads_reviews.google_day_4_spent IS 'Gasto do dia 4 (2 dias atrás)';
COMMENT ON COLUMN public.google_ads_reviews.google_day_5_spent IS 'Gasto do dia 5 (1 dia atrás)';
