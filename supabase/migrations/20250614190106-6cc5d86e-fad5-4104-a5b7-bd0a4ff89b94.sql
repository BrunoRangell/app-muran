
-- Adicionar foreign key constraint para campaign_health_snapshots
ALTER TABLE public.campaign_health_snapshots 
ADD CONSTRAINT fk_campaign_health_snapshots_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
