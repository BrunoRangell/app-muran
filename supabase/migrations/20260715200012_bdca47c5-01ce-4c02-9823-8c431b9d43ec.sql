ALTER TABLE public.bot_action_requests ALTER COLUMN target_id DROP NOT NULL;
ALTER TABLE public.bot_action_requests ALTER COLUMN level DROP NOT NULL;
ALTER TABLE public.bot_action_requests ADD COLUMN IF NOT EXISTS comando text;
ALTER TABLE public.bot_action_requests ADD COLUMN IF NOT EXISTS candidates_snapshot jsonb;