
-- Adicionar campo para armazenar dados detalhados das campanhas
ALTER TABLE public.campaign_health
ADD COLUMN campaigns_detailed JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.campaign_health.campaigns_detailed IS 'Array JSON com detalhes de cada campanha (id, name, cost, impressions, status)';
