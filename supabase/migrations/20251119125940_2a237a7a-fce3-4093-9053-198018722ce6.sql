-- Criar tabela de offboarding
CREATE TABLE public.offboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- ClickUp
  clickup_status TEXT DEFAULT 'pending',
  clickup_list_id TEXT,
  clickup_completed_at TIMESTAMPTZ,
  clickup_error JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.offboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage offboarding"
ON public.offboarding
FOR ALL
TO authenticated
USING (is_team_member())
WITH CHECK (is_team_member());

-- Trigger para updated_at
CREATE TRIGGER update_offboarding_timestamp
BEFORE UPDATE ON public.offboarding
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_timestamp();

-- Index para performance
CREATE INDEX idx_offboarding_client_id ON public.offboarding(client_id);
CREATE INDEX idx_offboarding_status ON public.offboarding(status);