
CREATE TABLE public.campaign_health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  client_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  unserved_count integer NOT NULL DEFAULT 0,
  total_active integer NOT NULL DEFAULT 0,
  discord_message_id text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (account_id, snapshot_date)
);

ALTER TABLE public.campaign_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view campaign health alerts"
ON public.campaign_health_alerts
FOR SELECT
USING (is_team_member());

CREATE POLICY "Service role can insert campaign health alerts"
ON public.campaign_health_alerts
FOR INSERT
WITH CHECK (true);
