
CREATE TABLE public.bot_action_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  platform text NOT NULL,
  level text NOT NULL,
  target_id text NOT NULL,
  target_name text,
  action text NOT NULL,
  new_value numeric,
  previous_value_snapshot jsonb,
  requested_by_discord_user text,
  channel_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  result jsonb
);

GRANT ALL ON public.bot_action_requests TO service_role;

ALTER TABLE public.bot_action_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.bot_action_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
