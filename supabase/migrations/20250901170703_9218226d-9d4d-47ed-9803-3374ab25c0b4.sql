-- Adicionar campos de saldo e modelo de cobrança na tabela client_accounts
ALTER TABLE public.client_accounts 
ADD COLUMN saldo_restante NUMERIC DEFAULT NULL,
ADD COLUMN is_prepay_account BOOLEAN DEFAULT FALSE;