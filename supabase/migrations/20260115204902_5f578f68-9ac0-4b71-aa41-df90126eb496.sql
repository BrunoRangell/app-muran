-- Inserir 3 templates de relatório pré-configurados
INSERT INTO public.report_templates (name, is_global, sections) VALUES

-- Template 1: Foco em Compras
('Foco em Compras', true, '{
  "widgets": [
    {"id": "title-1", "type": "text-block", "layout": {"x": 0, "y": 0, "w": 12, "h": 1}, "config": {"text": "Relatório de Performance - Compras", "textAlign": "center", "fontSize": "2xl", "fontWeight": "bold"}},
    {"id": "divider-1", "type": "divider", "layout": {"x": 0, "y": 1, "w": 12, "h": 1}, "config": {}},
    {"id": "metric-conversions", "type": "metric-card", "layout": {"x": 0, "y": 2, "w": 3, "h": 2}, "config": {"metric": "conversions", "title": "Conversões"}},
    {"id": "metric-spend", "type": "metric-card", "layout": {"x": 3, "y": 2, "w": 3, "h": 2}, "config": {"metric": "spend", "title": "Investimento"}},
    {"id": "metric-cpa", "type": "metric-card", "layout": {"x": 6, "y": 2, "w": 3, "h": 2}, "config": {"metric": "cpa", "title": "Custo por Conversão"}},
    {"id": "metric-ctr", "type": "metric-card", "layout": {"x": 9, "y": 2, "w": 3, "h": 2}, "config": {"metric": "ctr", "title": "Taxa de Clique"}},
    {"id": "title-2", "type": "text-block", "layout": {"x": 0, "y": 4, "w": 12, "h": 1}, "config": {"text": "Evolução das Conversões", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "chart-conversions", "type": "area-chart", "layout": {"x": 0, "y": 5, "w": 12, "h": 4}, "config": {"metrics": ["conversions", "spend"], "title": "Conversões e Investimento"}},
    {"id": "title-3", "type": "text-block", "layout": {"x": 0, "y": 9, "w": 12, "h": 1}, "config": {"text": "Análise de Custos", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "chart-spend", "type": "line-chart", "layout": {"x": 0, "y": 10, "w": 6, "h": 4}, "config": {"metrics": ["spend"], "title": "Investimento ao Longo do Tempo"}},
    {"id": "chart-cpa", "type": "bar-chart", "layout": {"x": 6, "y": 10, "w": 6, "h": 4}, "config": {"metrics": ["cpa"], "title": "CPA por Período"}},
    {"id": "title-4", "type": "text-block", "layout": {"x": 0, "y": 14, "w": 12, "h": 1}, "config": {"text": "Campanhas Ativas", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "campaigns-table", "type": "campaigns-table", "layout": {"x": 0, "y": 15, "w": 12, "h": 5}, "config": {"title": "Performance das Campanhas", "limit": 10}}
  ],
  "gridConfig": {"columns": 12, "rowHeight": 60}
}'::jsonb),

-- Template 2: Foco em Leads
('Foco em Leads', true, '{
  "widgets": [
    {"id": "title-1", "type": "text-block", "layout": {"x": 0, "y": 0, "w": 12, "h": 1}, "config": {"text": "Relatório de Performance - Leads", "textAlign": "center", "fontSize": "2xl", "fontWeight": "bold"}},
    {"id": "divider-1", "type": "divider", "layout": {"x": 0, "y": 1, "w": 12, "h": 1}, "config": {}},
    {"id": "metric-conversions", "type": "metric-card", "layout": {"x": 0, "y": 2, "w": 3, "h": 2}, "config": {"metric": "conversions", "title": "Leads Gerados"}},
    {"id": "metric-clicks", "type": "metric-card", "layout": {"x": 3, "y": 2, "w": 3, "h": 2}, "config": {"metric": "clicks", "title": "Cliques"}},
    {"id": "metric-ctr", "type": "metric-card", "layout": {"x": 6, "y": 2, "w": 3, "h": 2}, "config": {"metric": "ctr", "title": "Taxa de Clique"}},
    {"id": "metric-cpa", "type": "metric-card", "layout": {"x": 9, "y": 2, "w": 3, "h": 2}, "config": {"metric": "cpa", "title": "Custo por Lead"}},
    {"id": "title-2", "type": "text-block", "layout": {"x": 0, "y": 4, "w": 12, "h": 1}, "config": {"text": "Funil de Conversão", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "chart-funnel", "type": "area-chart", "layout": {"x": 0, "y": 5, "w": 12, "h": 4}, "config": {"metrics": ["clicks", "conversions"], "title": "Cliques vs Conversões"}},
    {"id": "title-3", "type": "text-block", "layout": {"x": 0, "y": 9, "w": 12, "h": 1}, "config": {"text": "Custo e Eficiência", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "chart-cpc", "type": "line-chart", "layout": {"x": 0, "y": 10, "w": 6, "h": 4}, "config": {"metrics": ["cpc"], "title": "CPC ao Longo do Tempo"}},
    {"id": "chart-cpa", "type": "bar-chart", "layout": {"x": 6, "y": 10, "w": 6, "h": 4}, "config": {"metrics": ["cpa"], "title": "Custo por Lead"}},
    {"id": "title-4", "type": "text-block", "layout": {"x": 0, "y": 14, "w": 12, "h": 1}, "config": {"text": "Campanhas de Lead", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "campaigns-table", "type": "campaigns-table", "layout": {"x": 0, "y": 15, "w": 12, "h": 5}, "config": {"title": "Performance das Campanhas", "limit": 10}},
    {"id": "title-5", "type": "text-block", "layout": {"x": 0, "y": 20, "w": 12, "h": 1}, "config": {"text": "Top Criativos", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "top-creatives", "type": "top-creatives", "layout": {"x": 0, "y": 21, "w": 12, "h": 4}, "config": {"metrics": ["conversions", "cpa"], "limit": 5, "title": "Melhores Criativos"}}
  ],
  "gridConfig": {"columns": 12, "rowHeight": 60}
}'::jsonb),

-- Template 3: Foco em Alcance
('Foco em Alcance', true, '{
  "widgets": [
    {"id": "title-1", "type": "text-block", "layout": {"x": 0, "y": 0, "w": 12, "h": 1}, "config": {"text": "Relatório de Performance - Alcance", "textAlign": "center", "fontSize": "2xl", "fontWeight": "bold"}},
    {"id": "divider-1", "type": "divider", "layout": {"x": 0, "y": 1, "w": 12, "h": 1}, "config": {}},
    {"id": "metric-reach", "type": "metric-card", "layout": {"x": 0, "y": 2, "w": 3, "h": 2}, "config": {"metric": "reach", "title": "Alcance"}},
    {"id": "metric-impressions", "type": "metric-card", "layout": {"x": 3, "y": 2, "w": 3, "h": 2}, "config": {"metric": "impressions", "title": "Impressões"}},
    {"id": "metric-clicks", "type": "metric-card", "layout": {"x": 6, "y": 2, "w": 3, "h": 2}, "config": {"metric": "clicks", "title": "Cliques"}},
    {"id": "metric-spend", "type": "metric-card", "layout": {"x": 9, "y": 2, "w": 3, "h": 2}, "config": {"metric": "spend", "title": "Investimento"}},
    {"id": "title-2", "type": "text-block", "layout": {"x": 0, "y": 4, "w": 12, "h": 1}, "config": {"text": "Evolução do Alcance", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "chart-reach", "type": "area-chart", "layout": {"x": 0, "y": 5, "w": 12, "h": 4}, "config": {"metrics": ["reach", "impressions"], "title": "Alcance vs Impressões"}},
    {"id": "title-3", "type": "text-block", "layout": {"x": 0, "y": 9, "w": 12, "h": 1}, "config": {"text": "Engajamento e Custo", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "chart-clicks", "type": "line-chart", "layout": {"x": 0, "y": 10, "w": 6, "h": 4}, "config": {"metrics": ["clicks", "ctr"], "title": "Cliques e CTR"}},
    {"id": "chart-cpc", "type": "bar-chart", "layout": {"x": 6, "y": 10, "w": 6, "h": 4}, "config": {"metrics": ["cpc"], "title": "Custo por Clique"}},
    {"id": "title-4", "type": "text-block", "layout": {"x": 0, "y": 14, "w": 12, "h": 1}, "config": {"text": "Demografia do Público", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "pie-age", "type": "pie-chart", "layout": {"x": 0, "y": 15, "w": 4, "h": 4}, "config": {"dimension": "age", "metric": "impressions", "title": "Por Idade", "showLegend": true}},
    {"id": "pie-gender", "type": "pie-chart", "layout": {"x": 4, "y": 15, "w": 4, "h": 4}, "config": {"dimension": "gender", "metric": "impressions", "title": "Por Gênero", "showLegend": true}},
    {"id": "pie-location", "type": "pie-chart", "layout": {"x": 8, "y": 15, "w": 4, "h": 4}, "config": {"dimension": "location", "metric": "impressions", "title": "Por Localização", "showLegend": true}},
    {"id": "title-5", "type": "text-block", "layout": {"x": 0, "y": 19, "w": 12, "h": 1}, "config": {"text": "Campanhas Ativas", "textAlign": "left", "fontSize": "lg", "fontWeight": "semibold"}},
    {"id": "campaigns-table", "type": "campaigns-table", "layout": {"x": 0, "y": 20, "w": 12, "h": 5}, "config": {"title": "Performance das Campanhas", "limit": 10}}
  ],
  "gridConfig": {"columns": 12, "rowHeight": 60}
}'::jsonb);