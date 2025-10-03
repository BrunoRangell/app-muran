-- FASE 4D: Criar índices compostos para otimizar queries frequentes
-- Índices para melhorar performance de joins e filtros

-- 1. Índice composto para client_accounts (usado em queries de Meta/Google Ads)
CREATE INDEX IF NOT EXISTS idx_client_accounts_client_platform_status 
ON public.client_accounts(client_id, platform, status);

-- 2. Índice composto para budget_reviews (usado em buscas de revisões por período)
CREATE INDEX IF NOT EXISTS idx_budget_reviews_client_platform_date 
ON public.budget_reviews(client_id, platform, review_date DESC);

-- 3. Índice composto para campaign_health (usado em verificações de veiculação)
CREATE INDEX IF NOT EXISTS idx_campaign_health_client_platform_date 
ON public.campaign_health(client_id, platform, snapshot_date DESC);

-- Log da criação dos índices
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'database_optimization',
  'Índices compostos criados para otimização de performance',
  jsonb_build_object(
    'indices', ARRAY[
      'idx_client_accounts_client_platform_status',
      'idx_budget_reviews_client_platform_date',
      'idx_campaign_health_client_platform_date'
    ],
    'timestamp', now(),
    'phase', 'FASE 4D'
  )
);