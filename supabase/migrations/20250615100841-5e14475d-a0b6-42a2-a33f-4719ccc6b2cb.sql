
ALTER TABLE public.campaign_health_snapshots
ADD COLUMN meta_unserved_campaigns_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN google_unserved_campaigns_count INTEGER NOT NULL DEFAULT 0;
