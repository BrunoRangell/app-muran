-- Adicionar coluna para timestamp de quando o saldo foi definido manualmente
ALTER TABLE public.client_accounts 
ADD COLUMN balance_set_at TIMESTAMP WITH TIME ZONE NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.client_accounts.balance_set_at IS 'Timestamp (UTC-3 Brasília) de quando o saldo foi definido manualmente pelo usuário';