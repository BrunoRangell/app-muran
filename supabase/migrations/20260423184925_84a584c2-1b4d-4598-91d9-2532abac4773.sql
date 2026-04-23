INSERT INTO public.report_templates (name, is_global, client_id, sections)
VALUES (
  'DashCortex (Premium Editável)',
  true,
  null,
  jsonb_build_object(
    'premiumTheme', 'dark',
    'version', 1,
    'gridConfig', jsonb_build_object('cols', 12, 'rowHeight', 80),
    'widgets', jsonb_build_array(
      -- 5 KPIs premium na primeira linha
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'premium-kpi',
        'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 2, 'h', 2),
        'config', jsonb_build_object('metrics', jsonb_build_array('impressions'), 'accent', '#ff6e00', 'showComparison', true)),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'premium-kpi',
        'layout', jsonb_build_object('x', 2, 'y', 0, 'w', 2, 'h', 2),
        'config', jsonb_build_object('metrics', jsonb_build_array('clicks'), 'accent', '#3b82f6', 'showComparison', true)),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'premium-kpi',
        'layout', jsonb_build_object('x', 4, 'y', 0, 'w', 2, 'h', 2),
        'config', jsonb_build_object('metrics', jsonb_build_array('conversions'), 'accent', '#10b981', 'showComparison', true)),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'premium-kpi',
        'layout', jsonb_build_object('x', 6, 'y', 0, 'w', 3, 'h', 2),
        'config', jsonb_build_object('metrics', jsonb_build_array('ctr'), 'accent', '#a855f7', 'showComparison', true)),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'premium-kpi',
        'layout', jsonb_build_object('x', 9, 'y', 0, 'w', 3, 'h', 2),
        'config', jsonb_build_object('metrics', jsonb_build_array('spend'), 'accent', '#f59e0b', 'showComparison', true)),
      -- Bloco Meta + Bloco Google
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'platform-block',
        'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 6, 'h', 4),
        'config', jsonb_build_object('platform', 'meta', 'accent', '#1877f2', 'mainMetric', 'spend',
          'sideMetrics', jsonb_build_array('clicks', 'conversions', 'cpa'), 'chartMetric', 'spend')),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'platform-block',
        'layout', jsonb_build_object('x', 6, 'y', 2, 'w', 6, 'h', 4),
        'config', jsonb_build_object('platform', 'google', 'accent', '#fbbc04', 'mainMetric', 'spend',
          'sideMetrics', jsonb_build_array('clicks', 'conversions', 'cpa'), 'chartMetric', 'spend')),
      -- Tabela de ranking + Pie chart
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'ranking-table',
        'layout', jsonb_build_object('x', 0, 'y', 6, 'w', 6, 'h', 5),
        'config', jsonb_build_object('rankingDataSource', 'regions', 'metrics', jsonb_build_array('conversions'),
          'limit', 8, 'accent', '#ff6e00', 'title', 'Top Regiões')),
      jsonb_build_object('id', gen_random_uuid()::text, 'type', 'pie-chart',
        'layout', jsonb_build_object('x', 6, 'y', 6, 'w', 6, 'h', 5),
        'config', jsonb_build_object('dimension', 'gender', 'metrics', jsonb_build_array('impressions'),
          'showLegend', true, 'chartType', 'pie', 'title', 'Distribuição por Gênero'))
    )
  )
);