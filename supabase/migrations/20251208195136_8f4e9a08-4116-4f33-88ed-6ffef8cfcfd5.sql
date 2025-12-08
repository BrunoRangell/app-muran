-- Tabela para gerenciar portais de clientes (links públicos)
CREATE TABLE public.client_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token VARCHAR(32) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  default_platform VARCHAR(10) DEFAULT 'both',
  default_period INTEGER DEFAULT 30,
  allow_period_change BOOLEAN DEFAULT true,
  allow_platform_change BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para busca por token
CREATE INDEX idx_client_portals_access_token ON public.client_portals(access_token);

-- Enable RLS
ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;

-- RLS: Leitura pública (token validado na aplicação)
CREATE POLICY "Public can read portals" ON public.client_portals
  FOR SELECT USING (true);

-- RLS: Team members podem gerenciar
CREATE POLICY "Team members can manage portals" ON public.client_portals
  FOR ALL USING (is_team_member()) WITH CHECK (is_team_member());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_client_portals_updated_at
  BEFORE UPDATE ON public.client_portals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();