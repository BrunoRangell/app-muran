CREATE TABLE public.low_balance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  client_id uuid NOT NULL,
  dias_restantes numeric NOT NULL,
  saldo numeric NOT NULL,
  daily_budget numeric NOT NULL,
  discord_message_id text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_low_balance_alerts_account_sent ON public.low_balance_alerts(account_id, sent_at DESC);

ALTER TABLE public.low_balance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view low balance alerts"
ON public.low_balance_alerts FOR SELECT
USING (is_team_member());

CREATE POLICY "Service role can insert low balance alerts"
ON public.low_balance_alerts FOR INSERT
WITH CHECK (true);