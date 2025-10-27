-- Criar tabela para metadata do token Meta
CREATE TABLE IF NOT EXISTS public.meta_token_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_type TEXT NOT NULL DEFAULT 'access_token',
  status TEXT NOT NULL DEFAULT 'active',
  last_refreshed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.meta_token_metadata ENABLE ROW LEVEL SECURITY;

-- Policy para admins
CREATE POLICY "Admin can manage meta token metadata"
  ON public.meta_token_metadata
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Inserir registro inicial
INSERT INTO public.meta_token_metadata (token_type, status, expires_at, details)
VALUES (
  'access_token',
  'active',
  now() + INTERVAL '60 days',
  jsonb_build_object(
    'app_id', '383063434848211',
    'renewal_frequency', '30 days',
    'auto_renewal_enabled', true
  )
)
ON CONFLICT DO NOTHING;

-- Criar cron job para renovar token Meta a cada 30 dias
SELECT cron.schedule(
  'meta-token-renewal-job',
  '0 0 1 * *', -- Todo dia 1 de cada mês às 00:00 (aproximadamente 30 dias)
  $$
  SELECT
    net.http_post(
      url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/refresh-meta-token',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);