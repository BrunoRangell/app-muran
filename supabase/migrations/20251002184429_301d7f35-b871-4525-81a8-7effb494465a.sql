-- Criar tabela onboarding para gerenciar processo de onboarding de clientes
CREATE TABLE IF NOT EXISTS public.onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Status geral do onboarding
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
  
  -- ClickUp
  clickup_folder_id TEXT,
  clickup_status TEXT DEFAULT 'pending' CHECK (clickup_status IN ('pending', 'in_progress', 'completed', 'failed')),
  clickup_error JSONB,
  clickup_completed_at TIMESTAMPTZ,
  
  -- Discord
  discord_channel_id TEXT,
  discord_channel_link TEXT,
  discord_status TEXT DEFAULT 'pending' CHECK (discord_status IN ('pending', 'in_progress', 'completed', 'failed')),
  discord_error JSONB,
  discord_completed_at TIMESTAMPTZ,
  
  -- Google Drive
  drive_folder_id TEXT,
  drive_folder_link TEXT,
  drive_status TEXT DEFAULT 'pending' CHECK (drive_status IN ('pending', 'in_progress', 'completed', 'failed')),
  drive_error JSONB,
  drive_completed_at TIMESTAMPTZ,
  
  -- Subpastas do Drive criadas
  drive_subfolders JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Um cliente só pode ter um registro de onboarding
  UNIQUE(client_id)
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_onboarding_client_id ON public.onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.onboarding(status);

-- Habilitar RLS
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

-- Policy para membros da equipe gerenciarem onboarding
CREATE POLICY "Team members can manage onboarding"
  ON public.onboarding
  FOR ALL
  USING (is_team_member())
  WITH CHECK (is_team_member());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON public.onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_onboarding_timestamp();