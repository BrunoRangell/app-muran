// Adapter: converte templates premium antigos (widgets WIDGET_CATALOG)
// para o novo formato premium-v2. Garante que NUNCA caia em "Widget não reconhecido".

import { TemplateWidget } from '@/types/template-editor';
import {
  PremiumBlock, PremiumBlockType, PremiumTemplateV2, createPremiumBlockId,
} from '@/types/premium-v2';

// Mapeamento direto de tipos legacy → premium-v2
const TYPE_MAP: Record<string, PremiumBlockType> = {
  'premium-kpi': 'premium.metric.kpi',
  'platform-block': 'premium.platform.summary',
  'ranking-table': 'premium.ranking.gradient',
  'pie-chart': 'premium.chart.donut',
  'line-chart': 'premium.chart.trend',
  'area-chart': 'premium.chart.trend',
  'bar-chart': 'premium.chart.trend',
  'text-block': 'premium.text.insight',
  'divider': 'premium.layout.divider',
  'spacer': 'premium.layout.spacer',
};

function adaptWidget(w: TemplateWidget): PremiumBlock | null {
  const newType = TYPE_MAP[w.type];
  if (!newType) return null;

  const c = w.config || {};
  return {
    id: createPremiumBlockId(),
    type: newType,
    layout: { x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h },
    config: {
      title: c.title,
      text: c.text,
      metric: c.metrics?.[0] || c.mainMetric,
      metrics: c.sideMetrics || c.metrics,
      platform: c.platform,
      rankingSource: c.rankingDataSource,
      donutSource:
        newType === 'premium.chart.donut'
          ? (c.dimension === 'gender' ? 'gender' : c.dimension === 'age' ? 'age' : 'platform')
          : undefined,
      chartSource: 'combined',
      limit: c.limit,
      accent: c.accent,
      showComparison: c.showComparison,
      showLegend: c.showLegend,
    },
  };
}

// Aceita qualquer formato e devolve PremiumTemplateV2.
// Se sections já for v2, retorna direto.
// Se for widget-based legacy com blocos premium, converte.
// Caso contrário, retorna null (não é premium).
export function adaptToPremiumV2(sections: any): PremiumTemplateV2 | null {
  if (!sections) return null;

  // Já é v2
  if (sections.engine === 'premium-v2' && Array.isArray(sections.blocks)) {
    return sections as PremiumTemplateV2;
  }

  // Widget-based com flag premium
  const widgets = sections.widgets;
  const isPremiumDark = sections.premiumTheme === 'dark';
  if (Array.isArray(widgets) && (isPremiumDark || widgets.some((w: any) => TYPE_MAP[w.type]))) {
    const blocks = widgets
      .map(adaptWidget)
      .filter((b): b is PremiumBlock => b !== null);
    if (blocks.length === 0) return null;
    return {
      engine: 'premium-v2',
      version: 1,
      theme: 'dark',
      showSidebar: true,
      blocks,
    };
  }

  return null;
}
