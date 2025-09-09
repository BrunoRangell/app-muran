-- Adicionar campo last_funding_detected_at para rastrear detecção de funding events
ALTER TABLE public.client_accounts 
ADD COLUMN last_funding_detected_at TIMESTAMP WITH TIME ZONE;