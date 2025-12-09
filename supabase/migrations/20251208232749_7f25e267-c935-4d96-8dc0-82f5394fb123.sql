-- Inserir template padrão "Dashboard Completo"
INSERT INTO report_templates (id, name, is_global, sections, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Dashboard Completo',
  true,
  '{
    "widgets": [
      {"id": "w1", "type": "metric-card", "layout": {"x": 0, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["impressions"], "showComparison": true}},
      {"id": "w2", "type": "metric-card", "layout": {"x": 3, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["reach"], "showComparison": true}},
      {"id": "w3", "type": "metric-card", "layout": {"x": 6, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["clicks"], "showComparison": true}},
      {"id": "w4", "type": "metric-card", "layout": {"x": 9, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["ctr"], "showComparison": true}},
      {"id": "w5", "type": "metric-card", "layout": {"x": 0, "y": 1, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["conversions"], "showComparison": true}},
      {"id": "w6", "type": "metric-card", "layout": {"x": 3, "y": 1, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["spend"], "showComparison": true}},
      {"id": "w7", "type": "metric-card", "layout": {"x": 6, "y": 1, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["cpa"], "showComparison": true}},
      {"id": "w8", "type": "metric-card", "layout": {"x": 9, "y": 1, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["cpc"], "showComparison": true}},
      {"id": "w9", "type": "line-chart", "layout": {"x": 0, "y": 2, "w": 6, "h": 2, "minW": 4, "minH": 2}, "config": {"title": "Impressões e Alcance", "metrics": ["impressions", "reach"], "showLegend": true, "chartType": "line"}},
      {"id": "w10", "type": "line-chart", "layout": {"x": 6, "y": 2, "w": 6, "h": 2, "minW": 4, "minH": 2}, "config": {"title": "Cliques", "metrics": ["clicks"], "showLegend": true, "chartType": "line"}},
      {"id": "w11", "type": "area-chart", "layout": {"x": 0, "y": 4, "w": 6, "h": 2, "minW": 4, "minH": 2}, "config": {"title": "Conversões", "metrics": ["conversions"], "showLegend": true, "chartType": "area"}},
      {"id": "w12", "type": "area-chart", "layout": {"x": 6, "y": 4, "w": 6, "h": 2, "minW": 4, "minH": 2}, "config": {"title": "Investimento", "metrics": ["spend"], "showLegend": true, "chartType": "area"}},
      {"id": "w13", "type": "bar-chart", "layout": {"x": 0, "y": 6, "w": 4, "h": 2, "minW": 3, "minH": 2}, "config": {"title": "Idade", "dataSource": "demographics", "showLegend": false, "chartType": "bar"}},
      {"id": "w14", "type": "pie-chart", "layout": {"x": 4, "y": 6, "w": 4, "h": 2, "minW": 3, "minH": 2}, "config": {"title": "Gênero", "dataSource": "demographics", "showLegend": true, "chartType": "pie"}},
      {"id": "w15", "type": "simple-table", "layout": {"x": 8, "y": 6, "w": 4, "h": 2, "minW": 3, "minH": 2}, "config": {"title": "Localização", "dataSource": "demographics", "limit": 5}},
      {"id": "w16", "type": "campaigns-table", "layout": {"x": 0, "y": 8, "w": 12, "h": 3, "minW": 8, "minH": 2}, "config": {"title": "Campanhas", "showTitle": true, "limit": 10}},
      {"id": "w17", "type": "top-creatives", "layout": {"x": 0, "y": 11, "w": 12, "h": 3, "minW": 6, "minH": 2}, "config": {"title": "Top Criativos", "showTitle": true, "limit": 5}}
    ],
    "gridConfig": {"cols": 12, "rowHeight": 100, "margin": [16, 16], "containerPadding": [16, 16]},
    "version": 1
  }'::jsonb,
  now(),
  now()
);

-- Inserir template "Resumo Executivo" (mais simples)
INSERT INTO report_templates (id, name, is_global, sections, created_at, updated_at)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'Resumo Executivo',
  true,
  '{
    "widgets": [
      {"id": "w1", "type": "metric-card", "layout": {"x": 0, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["impressions"], "showComparison": true}},
      {"id": "w2", "type": "metric-card", "layout": {"x": 3, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["clicks"], "showComparison": true}},
      {"id": "w3", "type": "metric-card", "layout": {"x": 6, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["conversions"], "showComparison": true}},
      {"id": "w4", "type": "metric-card", "layout": {"x": 9, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["spend"], "showComparison": true}},
      {"id": "w5", "type": "line-chart", "layout": {"x": 0, "y": 1, "w": 12, "h": 2, "minW": 8, "minH": 2}, "config": {"title": "Tendência de Performance", "metrics": ["impressions", "clicks", "conversions"], "showLegend": true, "chartType": "line"}},
      {"id": "w6", "type": "campaigns-table", "layout": {"x": 0, "y": 3, "w": 12, "h": 3, "minW": 8, "minH": 2}, "config": {"title": "Campanhas", "showTitle": true, "limit": 5}}
    ],
    "gridConfig": {"cols": 12, "rowHeight": 100, "margin": [16, 16], "containerPadding": [16, 16]},
    "version": 1
  }'::jsonb,
  now(),
  now()
);

-- Inserir template "Foco em Conversões"
INSERT INTO report_templates (id, name, is_global, sections, created_at, updated_at)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Foco em Conversões',
  true,
  '{
    "widgets": [
      {"id": "w1", "type": "metric-card", "layout": {"x": 0, "y": 0, "w": 4, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["conversions"], "showComparison": true}},
      {"id": "w2", "type": "metric-card", "layout": {"x": 4, "y": 0, "w": 4, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["cpa"], "showComparison": true}},
      {"id": "w3", "type": "metric-card", "layout": {"x": 8, "y": 0, "w": 4, "h": 1, "minW": 2, "minH": 1, "maxH": 2}, "config": {"metrics": ["spend"], "showComparison": true}},
      {"id": "w4", "type": "area-chart", "layout": {"x": 0, "y": 1, "w": 6, "h": 2, "minW": 4, "minH": 2}, "config": {"title": "Conversões ao Longo do Tempo", "metrics": ["conversions"], "showLegend": true, "chartType": "area"}},
      {"id": "w5", "type": "line-chart", "layout": {"x": 6, "y": 1, "w": 6, "h": 2, "minW": 4, "minH": 2}, "config": {"title": "CPA ao Longo do Tempo", "metrics": ["cpa"], "showLegend": true, "chartType": "line"}},
      {"id": "w6", "type": "pie-chart", "layout": {"x": 0, "y": 3, "w": 4, "h": 2, "minW": 3, "minH": 2}, "config": {"title": "Conversões por Gênero", "dataSource": "demographics", "showLegend": true, "chartType": "pie"}},
      {"id": "w7", "type": "bar-chart", "layout": {"x": 4, "y": 3, "w": 4, "h": 2, "minW": 3, "minH": 2}, "config": {"title": "Conversões por Idade", "dataSource": "demographics", "showLegend": false, "chartType": "bar"}},
      {"id": "w8", "type": "simple-table", "layout": {"x": 8, "y": 3, "w": 4, "h": 2, "minW": 3, "minH": 2}, "config": {"title": "Top Localizações", "dataSource": "demographics", "limit": 5}},
      {"id": "w9", "type": "top-creatives", "layout": {"x": 0, "y": 5, "w": 12, "h": 3, "minW": 6, "minH": 2}, "config": {"title": "Criativos com Melhor Performance", "showTitle": true, "limit": 5}}
    ],
    "gridConfig": {"cols": 12, "rowHeight": 100, "margin": [16, 16], "containerPadding": [16, 16]},
    "version": 1
  }'::jsonb,
  now(),
  now()
);