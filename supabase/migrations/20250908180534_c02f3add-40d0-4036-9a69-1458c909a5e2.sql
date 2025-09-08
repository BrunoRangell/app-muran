-- Adicionar campo last_funding_amount para armazenar o valor do último funding detectado (em BRL)
ALTER TABLE public.client_accounts
ADD COLUMN last_funding_amount numeric;
