
-- Inserir template global Premium Editável v2 usando novo engine
INSERT INTO public.report_templates (name, is_global, client_id, sections)
VALUES (
  'DashCortex Premium Editável v2',
  true,
  null,
  jsonb_build_object(
    'engine', 'premium-v2',
    'version', 1,
    'theme', 'dark',
    'showSidebar', true,
    'blocks', jsonb_build_array(
      -- Hero header (full width)
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.header.hero',
        'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 2),
        'config', jsonb_build_object(
          'eyebrow', 'Relatório de Performance',
          'title', 'Visão Geral Premium',
          'subtitle', 'Dados consolidados Meta Ads + Google Ads',
          'accent', '#ff6e00'
        )
      ),
      -- KPI: Investimento
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.metric.kpi',
        'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 3, 'h', 2),
        'config', jsonb_build_object(
          'metric', 'spend',
          'accent', '#ff6e00',
          'showComparison', true,
          'variant', 'default'
        )
      ),
      -- KPI: Impressões
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.metric.kpi',
        'layout', jsonb_build_object('x', 3, 'y', 2, 'w', 3, 'h', 2),
        'config', jsonb_build_object(
          'metric', 'impressions',
          'accent', '#8B5CF6',
          'showComparison', true,
          'variant', 'default'
        )
      ),
      -- KPI: Cliques
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.metric.kpi',
        'layout', jsonb_build_object('x', 6, 'y', 2, 'w', 3, 'h', 2),
        'config', jsonb_build_object(
          'metric', 'clicks',
          'accent', '#06B6D4',
          'showComparison', true,
          'variant', 'default'
        )
      ),
      -- KPI: Conversões
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.metric.kpi',
        'layout', jsonb_build_object('x', 9, 'y', 2, 'w', 3, 'h', 2),
        'config', jsonb_build_object(
          'metric', 'conversions',
          'accent', '#10B981',
          'showComparison', true,
          'variant', 'default'
        )
      ),
      -- Bloco Meta
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.platform.summary',
        'layout', jsonb_build_object('x', 0, 'y', 4, 'w', 6, 'h', 4),
        'config', jsonb_build_object(
          'platform', 'meta',
          'accent', '#1877F2',
          'metrics', jsonb_build_array('spend', 'impressions', 'clicks', 'conversions')
        )
      ),
      -- Bloco Google
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.platform.summary',
        'layout', jsonb_build_object('x', 6, 'y', 4, 'w', 6, 'h', 4),
        'config', jsonb_build_object(
          'platform', 'google',
          'accent', '#FBBC04',
          'metrics', jsonb_build_array('spend', 'impressions', 'clicks', 'conversions')
        )
      ),
      -- Ranking gradiente
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.ranking.gradient',
        'layout', jsonb_build_object('x', 0, 'y', 8, 'w', 7, 'h', 5),
        'config', jsonb_build_object(
          'title', 'Top Campanhas',
          'rankingSource', 'campaigns',
          'metric', 'spend',
          'limit', 5,
          'accent', '#ff6e00'
        )
      ),
      -- Donut por gênero
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'type', 'premium.chart.donut',
        'layout', jsonb_build_object('x', 7, 'y', 8, 'w', 5, 'h', 5),
        'config', jsonb_build_object(
          'title', 'Distribuição por Gênero',
          'donutSource', 'gender',
          'metric', 'impressions',
          'showLegend', true,
          'accent', '#8B5CF6'
        )
      )
    )
  )::jsonb
)
ON CONFLICT DO NOTHING;
