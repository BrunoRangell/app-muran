
-- Criar funções de segurança para evitar recursão RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT tm.permission
  FROM public.team_members tm
  WHERE tm.manager_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.manager_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT tm.permission = 'admin'
     FROM public.team_members tm
     WHERE tm.manager_id = auth.uid()
     LIMIT 1), 
    false
  );
$$;

-- Habilitar RLS em todas as tabelas que não têm
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_token_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_meta_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_current_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs_categories ENABLE ROW LEVEL SECURITY;

-- Remover políticas conflitantes existentes para recriar corretamente
DROP POLICY IF EXISTS "Apenas admins podem ver todos os clientes" ON public.clients;
DROP POLICY IF EXISTS "Permitir leitura pública de clientes" ON public.clients;
DROP POLICY IF EXISTS "Usuários autenticados podem ler e escrever" ON public.clients;
DROP POLICY IF EXISTS "Apenas admins podem ver todos os custos" ON public.costs;
DROP POLICY IF EXISTS "Apenas admins podem ver todos os pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Equipe pode atualizar pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Equipe pode inserir pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Equipe pode visualizar todos os pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Permitir insert para usuários autenticados" ON public.payments;
DROP POLICY IF EXISTS "Permitir select para usuários autenticados" ON public.payments;
DROP POLICY IF EXISTS "Permitir update para usuários autenticados" ON public.payments;

-- ========================================
-- POLÍTICAS PARA TABELAS DE SISTEMA (Apenas Admin)
-- ========================================

-- system_configs
CREATE POLICY "Admin can manage system configs"
ON public.system_configs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- system_logs
CREATE POLICY "Admin can view system logs"
ON public.system_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "System can insert logs"
ON public.system_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- cron_execution_logs
CREATE POLICY "Admin can view cron logs"
ON public.cron_execution_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "System can insert cron logs"
ON public.cron_execution_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- google_ads_token_metadata
CREATE POLICY "Admin can manage token metadata"
ON public.google_ads_token_metadata
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ========================================
-- POLÍTICAS PARA TABELAS DE NEGÓCIO (Equipe)
-- ========================================

-- clients
CREATE POLICY "Team members can manage clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- costs
CREATE POLICY "Team members can manage costs"
ON public.costs
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- payments
CREATE POLICY "Team members can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- custom_budgets
CREATE POLICY "Team members can manage custom budgets"
ON public.custom_budgets
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- imported_transactions
CREATE POLICY "Team members can manage imported transactions"
ON public.imported_transactions
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- costs_categories
CREATE POLICY "Team members can manage cost categories"
ON public.costs_categories
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- ========================================
-- POLÍTICAS PARA TABELAS DE DADOS ESPECÍFICAS
-- ========================================

-- google_ads_reviews
CREATE POLICY "Team members can manage google ads reviews"
ON public.google_ads_reviews
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- client_current_reviews
CREATE POLICY "Team members can manage client current reviews"
ON public.client_current_reviews
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- client_meta_accounts
CREATE POLICY "Team members can manage client meta accounts"
ON public.client_meta_accounts
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- client_google_accounts
CREATE POLICY "Team members can manage client google accounts"
ON public.client_google_accounts
FOR ALL
TO authenticated
USING (public.is_team_member())
WITH CHECK (public.is_team_member());

-- scheduled_tasks
CREATE POLICY "Admin can manage scheduled tasks"
ON public.scheduled_tasks
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política especial para permitir que o sistema (edge functions) insertem dados
CREATE POLICY "System can insert scheduled tasks"
ON public.scheduled_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- POLÍTICAS ESPECIAIS PARA OPERAÇÕES DO SISTEMA
-- ========================================

-- Permitir que edge functions acessem dados necessários
CREATE POLICY "Allow campaign health snapshots access"
ON public.campaign_health_snapshots
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Comentário: Esta tabela já tem políticas permissivas e é usada pelo sistema de monitoramento
-- Manter as políticas existentes que permitem acesso total
