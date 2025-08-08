-- Remover a foreign key duplicada que está causando conflito
ALTER TABLE payments DROP CONSTRAINT IF EXISTS client_exists;

-- Verificar se ainda existe a constraint principal
-- A constraint payments_client_id_fkey deve permanecer