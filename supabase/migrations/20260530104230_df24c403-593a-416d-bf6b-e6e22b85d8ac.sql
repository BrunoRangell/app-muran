ALTER TABLE public.client_accounts DROP CONSTRAINT IF EXISTS unique_account_per_platform;

CREATE UNIQUE INDEX unique_account_per_platform
  ON public.client_accounts (platform, account_id)
  WHERE account_id IS NOT NULL AND account_id <> '';