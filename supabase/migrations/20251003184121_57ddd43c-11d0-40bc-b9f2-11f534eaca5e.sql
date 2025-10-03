-- ==========================================
-- FASE 2B: Otimização de Queries com Índices
-- ==========================================

-- Índices para campaign_health (queries mais pesadas do sistema)
CREATE INDEX IF NOT EXISTS idx_campaign_health_snapshot_date 
  ON public.campaign_health(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_health_account_client 
  ON public.campaign_health(account_id, client_id);

CREATE INDEX IF NOT EXISTS idx_campaign_health_platform_date 
  ON public.campaign_health(platform, snapshot_date DESC);

-- Índices para budget_reviews
CREATE INDEX IF NOT EXISTS idx_budget_reviews_review_date 
  ON public.budget_reviews(review_date DESC);

CREATE INDEX IF NOT EXISTS idx_budget_reviews_client_platform 
  ON public.budget_reviews(client_id, platform);

CREATE INDEX IF NOT EXISTS idx_budget_reviews_account 
  ON public.budget_reviews(account_id);

-- Índices para client_accounts (usado em quase todas as queries)
CREATE INDEX IF NOT EXISTS idx_client_accounts_client_status 
  ON public.client_accounts(client_id, status);

CREATE INDEX IF NOT EXISTS idx_client_accounts_platform 
  ON public.client_accounts(platform, status);

-- Índices para costs (dashboard financeiro)
CREATE INDEX IF NOT EXISTS idx_costs_date 
  ON public.costs(date DESC);

CREATE INDEX IF NOT EXISTS idx_costs_date_amount 
  ON public.costs(date DESC, amount);

-- Índices para payments (cálculos de LTV)
CREATE INDEX IF NOT EXISTS idx_payments_reference_month 
  ON public.payments(reference_month DESC);

CREATE INDEX IF NOT EXISTS idx_payments_client_month 
  ON public.payments(client_id, reference_month DESC);

-- Índice para clients (status ativo é usado em todas as queries)
CREATE INDEX IF NOT EXISTS idx_clients_status 
  ON public.clients(status);

-- Índice composto para custom_budgets
CREATE INDEX IF NOT EXISTS idx_custom_budgets_active_dates 
  ON public.custom_budgets(is_active, start_date, end_date) 
  WHERE is_active = true;

-- ==========================================
-- Comentários sobre os índices criados
-- ==========================================
COMMENT ON INDEX idx_campaign_health_snapshot_date IS 'Acelera queries por data de snapshot';
COMMENT ON INDEX idx_campaign_health_account_client IS 'Otimiza joins entre contas e clientes';
COMMENT ON INDEX idx_budget_reviews_review_date IS 'Acelera busca de revisões por data';
COMMENT ON INDEX idx_payments_client_month IS 'Otimiza cálculos de LTV por cliente e período';
COMMENT ON INDEX idx_costs_date IS 'Acelera queries do dashboard financeiro';
COMMENT ON INDEX idx_custom_budgets_active_dates IS 'Otimiza busca de orçamentos ativos no período';