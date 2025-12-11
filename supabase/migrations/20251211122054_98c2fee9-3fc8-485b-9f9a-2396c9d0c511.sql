-- Create widget_presets table for customizable quick blocks
CREATE TABLE public.widget_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'LayoutGrid',
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.widget_presets ENABLE ROW LEVEL SECURITY;

-- Team members can manage presets
CREATE POLICY "Team members can manage widget presets"
ON public.widget_presets
FOR ALL
USING (is_team_member())
WITH CHECK (is_team_member());

-- Trigger for updated_at
CREATE TRIGGER update_widget_presets_updated_at
BEFORE UPDATE ON public.widget_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system presets
INSERT INTO public.widget_presets (name, description, icon, widgets, is_system) VALUES
(
  'Visão Geral Completa',
  'Adiciona 8 cards de métricas principais lado a lado',
  'LayoutGrid',
  '[
    {"type": "metric-card", "layout": {"x": 0, "y": 0, "w": 3, "h": 2}, "config": {"metric": "impressions"}},
    {"type": "metric-card", "layout": {"x": 3, "y": 0, "w": 3, "h": 2}, "config": {"metric": "reach"}},
    {"type": "metric-card", "layout": {"x": 6, "y": 0, "w": 3, "h": 2}, "config": {"metric": "clicks"}},
    {"type": "metric-card", "layout": {"x": 9, "y": 0, "w": 3, "h": 2}, "config": {"metric": "ctr"}},
    {"type": "metric-card", "layout": {"x": 0, "y": 2, "w": 3, "h": 2}, "config": {"metric": "spend"}},
    {"type": "metric-card", "layout": {"x": 3, "y": 2, "w": 3, "h": 2}, "config": {"metric": "cpm"}},
    {"type": "metric-card", "layout": {"x": 6, "y": 2, "w": 3, "h": 2}, "config": {"metric": "conversions"}},
    {"type": "metric-card", "layout": {"x": 9, "y": 2, "w": 3, "h": 2}, "config": {"metric": "costPerResult"}}
  ]'::jsonb,
  true
),
(
  'Gráficos de Tendência',
  'Adiciona 4 gráficos de linha para análise temporal',
  'TrendingUp',
  '[
    {"type": "line-chart", "layout": {"x": 0, "y": 0, "w": 6, "h": 4}, "config": {"metrics": ["impressions", "reach"], "dataSource": "timeSeries"}},
    {"type": "line-chart", "layout": {"x": 6, "y": 0, "w": 6, "h": 4}, "config": {"metrics": ["clicks", "ctr"], "dataSource": "timeSeries"}},
    {"type": "area-chart", "layout": {"x": 0, "y": 4, "w": 6, "h": 4}, "config": {"metrics": ["spend"], "dataSource": "timeSeries"}},
    {"type": "bar-chart", "layout": {"x": 6, "y": 4, "w": 6, "h": 4}, "config": {"metrics": ["conversions"], "dataSource": "timeSeries"}}
  ]'::jsonb,
  true
),
(
  'Demografia Completa',
  'Gráficos de idade, gênero e localização',
  'Users',
  '[
    {"type": "bar-chart", "layout": {"x": 0, "y": 0, "w": 6, "h": 4}, "config": {"dataSource": "demographics", "title": "Faixa Etária"}},
    {"type": "pie-chart", "layout": {"x": 6, "y": 0, "w": 6, "h": 4}, "config": {"dataSource": "demographics", "title": "Gênero"}},
    {"type": "table", "layout": {"x": 0, "y": 4, "w": 12, "h": 4}, "config": {"dataSource": "demographics", "title": "Top Localizações"}}
  ]'::jsonb,
  true
);