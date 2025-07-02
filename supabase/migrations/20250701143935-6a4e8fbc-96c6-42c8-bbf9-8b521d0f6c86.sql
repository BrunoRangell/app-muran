
-- 1. CRIAR NOVA TABELA UNIFICADA DE CONTAS DOS CLIENTES
CREATE TABLE public.client_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('meta', 'google')),
  account_id varchar NOT NULL,
  account_name varchar NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  budget_amount numeric NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Garantir que cada cliente tenha apenas uma conta principal por plataforma
  CONSTRAINT unique_primary_per_platform UNIQUE (client_id, platform, is_primary) DEFERRABLE INITIALLY DEFERRED,
  -- Garantir unicidade de account_id por plataforma
  CONSTRAINT unique_account_per_platform UNIQUE (platform, account_id)
);

-- Índices para performance
CREATE INDEX idx_client_accounts_client_platform ON public.client_accounts (client_id, platform);
CREATE INDEX idx_client_accounts_platform_status ON public.client_accounts (platform, status);

-- 2. CRIAR NOVA TABELA UNIFICADA DE REVISÕES DE ORÇAMENTO
CREATE TABLE public.budget_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  platform text NOT NULL CHECK (platform IN ('meta', 'google')),
  
  -- Dados de orçamento
  daily_budget_current numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  
  -- Orçamento personalizado
  using_custom_budget boolean DEFAULT false,
  custom_budget_id uuid REFERENCES public.custom_budgets(id),
  custom_budget_amount numeric,
  custom_budget_start_date date,
  custom_budget_end_date date,
  
  -- Controle de avisos
  warning_ignored_today boolean DEFAULT false,
  warning_ignored_date date,
  
  -- Dados específicos do Google Ads (histórico de 5 dias)
  day_1_spent numeric DEFAULT 0,
  day_2_spent numeric DEFAULT 0,
  day_3_spent numeric DEFAULT 0,
  day_4_spent numeric DEFAULT 0,
  day_5_spent numeric DEFAULT 0,
  last_five_days_spent numeric DEFAULT 0,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Garantir uma revisão por conta por data
  CONSTRAINT unique_review_per_account_date UNIQUE (account_id, review_date)
);

-- Índices para performance
CREATE INDEX idx_budget_reviews_client_date ON public.budget_reviews (client_id, review_date DESC);
CREATE INDEX idx_budget_reviews_account_date ON public.budget_reviews (account_id, review_date DESC);
CREATE INDEX idx_budget_reviews_platform_date ON public.budget_reviews (platform, review_date DESC);

-- 3. CRIAR NOVA TABELA UNIFICADA DE SAÚDE DAS CAMPANHAS
CREATE TABLE public.campaign_health (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  platform text NOT NULL CHECK (platform IN ('meta', 'google')),
  
  -- Métricas principais
  has_account boolean NOT NULL DEFAULT true,
  active_campaigns_count integer NOT NULL DEFAULT 0,
  unserved_campaigns_count integer NOT NULL DEFAULT 0,
  cost_today numeric NOT NULL DEFAULT 0,
  impressions_today integer NOT NULL DEFAULT 0,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Garantir um snapshot por conta por data
  CONSTRAINT unique_snapshot_per_account_date UNIQUE (account_id, snapshot_date)
);

-- Índices para performance
CREATE INDEX idx_campaign_health_client_date ON public.campaign_health (client_id, snapshot_date DESC);
CREATE INDEX idx_campaign_health_account_date ON public.campaign_health (account_id, snapshot_date DESC);
CREATE INDEX idx_campaign_health_platform_date ON public.campaign_health (platform, snapshot_date DESC);

-- 4. MIGRAR DADOS EXISTENTES

-- Migrar contas Meta
INSERT INTO public.client_accounts (client_id, platform, account_id, account_name, is_primary, budget_amount, status, created_at, updated_at)
SELECT 
  client_id,
  'meta' as platform,
  account_id,
  account_name,
  is_primary,
  budget_amount,
  status,
  created_at,
  updated_at
FROM public.client_meta_accounts
WHERE account_id IS NOT NULL AND account_name IS NOT NULL;

-- Migrar contas Google
INSERT INTO public.client_accounts (client_id, platform, account_id, account_name, is_primary, budget_amount, status, created_at, updated_at)
SELECT 
  client_id,
  'google' as platform,
  account_id,
  account_name,
  is_primary,
  budget_amount,
  status,
  created_at,
  updated_at
FROM public.client_google_accounts
WHERE account_id IS NOT NULL AND account_name IS NOT NULL;

-- 5. ATUALIZAR TABELA CUSTOM_BUDGETS para referenciar a nova estrutura
ALTER TABLE public.custom_budgets 
ADD COLUMN account_id_new uuid REFERENCES public.client_accounts(id);

-- Migrar referências de custom_budgets para a nova estrutura
UPDATE public.custom_budgets cb
SET account_id_new = ca.id
FROM public.client_accounts ca
WHERE cb.client_id = ca.client_id 
  AND cb.platform = ca.platform 
  AND (cb.account_id = ca.account_id OR cb.account_id IS NULL);

-- Remover coluna antiga e renomear
ALTER TABLE public.custom_budgets DROP COLUMN account_id;
ALTER TABLE public.custom_budgets RENAME COLUMN account_id_new TO account_id;

-- 6. CONFIGURAR RLS (Row Level Security)
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_health ENABLE ROW LEVEL SECURITY;

-- Políticas para client_accounts
CREATE POLICY "Team members can manage client accounts" ON public.client_accounts
  FOR ALL USING (is_team_member()) WITH CHECK (is_team_member());

-- Políticas para budget_reviews
CREATE POLICY "Team members can manage budget reviews" ON public.budget_reviews
  FOR ALL USING (is_team_member()) WITH CHECK (is_team_member());

-- Políticas para campaign_health
CREATE POLICY "Team members can manage campaign health" ON public.campaign_health
  FOR ALL USING (is_team_member()) WITH CHECK (is_team_member());

-- 7. CRIAR TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_client_accounts_updated_at
  BEFORE UPDATE ON public.client_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_budget_reviews_updated_at
  BEFORE UPDATE ON public.budget_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

CREATE TRIGGER update_campaign_health_updated_at
  BEFORE UPDATE ON public.campaign_health
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

-- 8. REMOVER COLUNAS REDUNDANTES DA TABELA CLIENTS
ALTER TABLE public.clients 
DROP COLUMN IF EXISTS meta_account_id,
DROP COLUMN IF EXISTS google_account_id,
DROP COLUMN IF EXISTS meta_ads_budget,
DROP COLUMN IF EXISTS google_ads_budget;

-- 9. ADICIONAR CONSTRAINT PARA GARANTIR PELO MENOS UMA CONTA PRINCIPAL
-- (Esta será validada via trigger ou aplicação)

-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.client_accounts IS 'Tabela unificada para todas as contas dos clientes (Meta e Google Ads)';
COMMENT ON TABLE public.budget_reviews IS 'Tabela unificada para todas as revisões de orçamento';
COMMENT ON TABLE public.campaign_health IS 'Tabela unificada para snapshots de saúde das campanhas';

COMMENT ON COLUMN public.client_accounts.is_primary IS 'Indica se esta é a conta principal do cliente para esta plataforma';
COMMENT ON COLUMN public.budget_reviews.account_id IS 'Referência para a conta específica na tabela client_accounts';
COMMENT ON COLUMN public.campaign_health.account_id IS 'Referência para a conta específica na tabela client_accounts';
