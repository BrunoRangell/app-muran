-- Tabela para templates de relatórios
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) NULL,
  is_global BOOLEAN DEFAULT false,
  sections JSONB NOT NULL DEFAULT '{
    "overview": {"enabled": true, "order": 1},
    "demographics": {"enabled": true, "order": 2},
    "topCreatives": {"enabled": true, "order": 3, "limit": 5},
    "conversionFunnel": {"enabled": true, "order": 4},
    "campaignTable": {"enabled": true, "order": 5},
    "trendCharts": {"enabled": true, "order": 6}
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage report templates"
ON public.report_templates
FOR ALL
USING (is_team_member())
WITH CHECK (is_team_member());

-- Criar templates pré-definidos globais
INSERT INTO public.report_templates (name, is_global, sections) VALUES
('Resumo Executivo', true, '{
  "overview": {"enabled": true, "order": 1},
  "topCreatives": {"enabled": true, "order": 2, "limit": 5},
  "trendCharts": {"enabled": true, "order": 3},
  "demographics": {"enabled": false, "order": 4},
  "conversionFunnel": {"enabled": false, "order": 5},
  "campaignTable": {"enabled": false, "order": 6}
}'::jsonb),
('Análise Completa', true, '{
  "overview": {"enabled": true, "order": 1},
  "demographics": {"enabled": true, "order": 2},
  "topCreatives": {"enabled": true, "order": 3, "limit": 10},
  "conversionFunnel": {"enabled": true, "order": 4},
  "campaignTable": {"enabled": true, "order": 5},
  "trendCharts": {"enabled": true, "order": 6}
}'::jsonb),
('Performance de Criativos', true, '{
  "topCreatives": {"enabled": true, "order": 1, "limit": 10},
  "demographics": {"enabled": true, "order": 2},
  "overview": {"enabled": true, "order": 3},
  "trendCharts": {"enabled": true, "order": 4},
  "conversionFunnel": {"enabled": false, "order": 5},
  "campaignTable": {"enabled": false, "order": 6}
}'::jsonb),
('Foco em Conversões', true, '{
  "conversionFunnel": {"enabled": true, "order": 1},
  "overview": {"enabled": true, "order": 2},
  "demographics": {"enabled": true, "order": 3},
  "campaignTable": {"enabled": true, "order": 4},
  "topCreatives": {"enabled": false, "order": 5, "limit": 5},
  "trendCharts": {"enabled": false, "order": 6}
}'::jsonb);

-- Trigger para updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();