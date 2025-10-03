-- Fase 1: Correções de Alta Prioridade - Security Review

-- ============================================
-- FIX 1: goals table - Remover acesso público e restringir a donos/admins
-- ============================================

-- Remover política permissiva que permite qualquer usuário autenticado ver todas as metas
DROP POLICY IF EXISTS "Permitir select para usuários autenticados" ON public.goals;

-- Criar política segura: apenas o dono da meta ou admins podem visualizar
CREATE POLICY "Users can view own goals and admins view all"
ON public.goals
FOR SELECT
USING (
  auth.uid() = manager_id 
  OR is_admin()
);

-- ============================================
-- FIX 2: badges table - Atualizar políticas para usar is_admin()
-- ============================================

-- Remover políticas antigas que verificam team_members.permission diretamente
DROP POLICY IF EXISTS "Permitir deleção de emblemas apenas por admins" ON public.badges;
DROP POLICY IF EXISTS "Permitir inserção de emblemas apenas por admins" ON public.badges;

-- Criar políticas atualizadas usando a função is_admin()
CREATE POLICY "Admins can delete badges"
ON public.badges 
FOR DELETE
USING (is_admin());

CREATE POLICY "Admins can insert badges"
ON public.badges 
FOR INSERT
WITH CHECK (is_admin());