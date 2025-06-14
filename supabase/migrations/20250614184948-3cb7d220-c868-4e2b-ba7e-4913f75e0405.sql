
-- Criar tabela para snapshots de saúde de campanhas
CREATE TABLE public.campaign_health_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Meta Ads data
  meta_account_id character varying,
  meta_account_name character varying,
  meta_has_account boolean DEFAULT false,
  meta_active_campaigns_count integer DEFAULT 0,
  meta_cost_today numeric DEFAULT 0,
  meta_impressions_today integer DEFAULT 0,
  
  -- Google Ads data
  google_account_id character varying,
  google_account_name character varying,
  google_has_account boolean DEFAULT false,
  google_active_campaigns_count integer DEFAULT 0,
  google_cost_today numeric DEFAULT 0,
  google_impressions_today integer DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX idx_campaign_health_snapshots_client_date 
ON public.campaign_health_snapshots (client_id, snapshot_date);

CREATE INDEX idx_campaign_health_snapshots_date 
ON public.campaign_health_snapshots (snapshot_date);

-- Criar constraint para evitar duplicatas
ALTER TABLE public.campaign_health_snapshots 
ADD CONSTRAINT unique_client_snapshot_date 
UNIQUE (client_id, snapshot_date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_campaign_health_snapshots_updated_at
  BEFORE UPDATE ON public.campaign_health_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp_column();

-- Habilitar RLS (caso necessário no futuro)
ALTER TABLE public.campaign_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir todas as operações (pode ser refinada depois)
CREATE POLICY "Allow all operations on campaign_health_snapshots" 
ON public.campaign_health_snapshots 
FOR ALL 
TO authenticated, anon 
USING (true) 
WITH CHECK (true);
