-- Adicionar campo logo_url na tabela clients para permitir upload de logos personalizadas
ALTER TABLE public.clients 
ADD COLUMN logo_url text DEFAULT NULL;