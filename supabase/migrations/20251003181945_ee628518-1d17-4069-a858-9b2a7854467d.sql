-- Fase 2: Remover campo permission legado da tabela team_members
-- AVISO: Esta migração remove o campo permission que foi substituído por user_roles
-- Certifique-se de que todos os códigos frontend já estão usando useUserRole()

-- Remover o campo permission da tabela team_members
ALTER TABLE public.team_members DROP COLUMN IF EXISTS permission;

-- Log da operação
INSERT INTO public.system_logs (event_type, message, details)
VALUES (
  'security_migration', 
  'Campo permission removido de team_members - migrando para user_roles',
  jsonb_build_object(
    'timestamp', now(),
    'reason', 'Eliminar inconsistência de permissões e prevenir escalação de privilégios',
    'replaced_by', 'user_roles table com RLS policies'
  )
);