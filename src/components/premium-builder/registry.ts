// ===== Premium Block Registry =====
// Fonte única da verdade para blocos premium. Cada bloco define:
//  - metadata para a paleta
//  - configuração default
//  - renderer (compartilhado entre editor preview e portal)
//  - painel de propriedades

import {
  Sparkles, LayoutPanelTop, BarChartHorizontal, PieChart as PieIcon,
  TrendingUp, Type, Heading1, Minus, Space as SpaceIcon, Crown,
} from 'lucide-react';
import type { ComponentType } from 'react';
import {
  PremiumBlock, PremiumBlockConfig, PremiumBlockLayout, PremiumBlockType,
} from '@/types/premium-v2';
import type { PremiumDataContext } from './renderer/types';

// Renderer recebe sempre block + dados
export type PremiumBlockRenderer = ComponentType<{
  block: PremiumBlock;
  data: PremiumDataContext;
}>;

export interface PremiumBlockDefinition {
  type: PremiumBlockType;
  name: string;
  description: string;
  category: 'metric' | 'platform' | 'ranking' | 'chart' | 'content' | 'layout';
  icon: ComponentType<{ className?: string }>;
  defaultLayout: Omit<PremiumBlockLayout, 'x' | 'y'>;
  defaultConfig: PremiumBlockConfig;
  renderer: PremiumBlockRenderer;
  // Quais campos o painel de propriedades deve mostrar
  propertyFields: PropertyField[];
}

export type PropertyField =
  | { kind: 'title' }
  | { kind: 'eyebrow' }
  | { kind: 'subtitle' }
  | { kind: 'text' }
  | { kind: 'metric' }
  | { kind: 'metrics-multi'; max?: number }
  | { kind: 'platform' }
  | { kind: 'rankingSource' }
  | { kind: 'chartSource' }
  | { kind: 'donutSource' }
  | { kind: 'limit'; min?: number; max?: number }
  | { kind: 'accent' }
  | { kind: 'variant' }
  | { kind: 'showComparison' }
  | { kind: 'showLegend' }
  | { kind: 'showTrend' }
  | { kind: 'align' };

// Lazy import para evitar ciclo
import { HeroBlock } from './blocks/HeroBlock';
import { KpiBlock } from './blocks/KpiBlock';
import { PlatformBlock } from './blocks/PlatformBlock';
import { RankingBlock } from './blocks/RankingBlock';
import { DonutBlock } from './blocks/DonutBlock';
import { TrendBlock } from './blocks/TrendBlock';
import { InsightBlock } from './blocks/InsightBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { SpacerBlock } from './blocks/SpacerBlock';

export const PREMIUM_BLOCK_REGISTRY: Record<PremiumBlockType, PremiumBlockDefinition> = {
  'premium.header.hero': {
    type: 'premium.header.hero',
    name: 'Cabeçalho Hero',
    description: 'Topo do relatório com eyebrow + título + subtítulo',
    category: 'content',
    icon: Crown,
    defaultLayout: { w: 12, h: 2, minW: 6, minH: 2 },
    defaultConfig: {
      eyebrow: 'Dashboard Premium',
      title: 'Overview',
      subtitle: 'Performance no período',
      accent: '#ff6e00',
      align: 'left',
    },
    renderer: HeroBlock,
    propertyFields: [
      { kind: 'eyebrow' },
      { kind: 'title' },
      { kind: 'subtitle' },
      { kind: 'accent' },
      { kind: 'align' },
    ],
  },

  'premium.metric.kpi': {
    type: 'premium.metric.kpi',
    name: 'KPI Premium',
    description: 'Card de métrica com ícone, valor, comparativo e barra',
    category: 'metric',
    icon: Sparkles,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultConfig: {
      metric: 'impressions',
      accent: '#ff6e00',
      showComparison: true,
      variant: 'default',
    },
    renderer: KpiBlock,
    propertyFields: [
      { kind: 'title' },
      { kind: 'metric' },
      { kind: 'accent' },
      { kind: 'showComparison' },
      { kind: 'variant' },
    ],
  },

  'premium.platform.summary': {
    type: 'premium.platform.summary',
    name: 'Bloco de Plataforma',
    description: 'Bloco grande de Meta ou Google com gráfico + métricas laterais',
    category: 'platform',
    icon: LayoutPanelTop,
    defaultLayout: { w: 6, h: 4, minW: 4, minH: 4 },
    defaultConfig: {
      platform: 'meta',
      accent: '#1877f2',
      metric: 'spend',
      metrics: ['clicks', 'conversions', 'cpa'],
      showTrend: true,
    },
    renderer: PlatformBlock,
    propertyFields: [
      { kind: 'title' },
      { kind: 'platform' },
      { kind: 'metric' },
      { kind: 'metrics-multi', max: 3 },
      { kind: 'accent' },
      { kind: 'showTrend' },
    ],
  },

  'premium.ranking.gradient': {
    type: 'premium.ranking.gradient',
    name: 'Ranking com Gradiente',
    description: 'Lista vertical com barras gradiente (regiões, campanhas, criativos…)',
    category: 'ranking',
    icon: BarChartHorizontal,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 3 },
    defaultConfig: {
      rankingSource: 'regions',
      metric: 'conversions',
      accent: '#ff6e00',
      limit: 8,
    },
    renderer: RankingBlock,
    propertyFields: [
      { kind: 'title' },
      { kind: 'rankingSource' },
      { kind: 'metric' },
      { kind: 'limit', min: 3, max: 20 },
      { kind: 'accent' },
    ],
  },

  'premium.chart.donut': {
    type: 'premium.chart.donut',
    name: 'Donut Premium',
    description: 'Gráfico de rosca para distribuição (origem, gênero, idade)',
    category: 'chart',
    icon: PieIcon,
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: {
      donutSource: 'platform',
      metric: 'impressions',
      accent: '#ff6e00',
      showLegend: true,
    },
    renderer: DonutBlock,
    propertyFields: [
      { kind: 'title' },
      { kind: 'donutSource' },
      { kind: 'metric' },
      { kind: 'showLegend' },
      { kind: 'accent' },
    ],
  },

  'premium.chart.trend': {
    type: 'premium.chart.trend',
    name: 'Tendência Premium',
    description: 'Gráfico de área/linha com gradiente premium',
    category: 'chart',
    icon: TrendingUp,
    defaultLayout: { w: 8, h: 4, minW: 4, minH: 3 },
    defaultConfig: {
      metric: 'spend',
      chartSource: 'combined',
      accent: '#ff6e00',
      showComparison: false,
    },
    renderer: TrendBlock,
    propertyFields: [
      { kind: 'title' },
      { kind: 'metric' },
      { kind: 'chartSource' },
      { kind: 'accent' },
    ],
  },

  'premium.text.insight': {
    type: 'premium.text.insight',
    name: 'Insight / Comentário',
    description: 'Caixa premium para destacar uma observação estratégica',
    category: 'content',
    icon: Type,
    defaultLayout: { w: 6, h: 2, minW: 3, minH: 2 },
    defaultConfig: {
      title: 'Insight da semana',
      text: 'Escreva aqui um insight estratégico sobre os resultados.',
      accent: '#ff6e00',
      variant: 'subtle',
    },
    renderer: InsightBlock,
    propertyFields: [
      { kind: 'title' },
      { kind: 'text' },
      { kind: 'accent' },
      { kind: 'variant' },
    ],
  },

  'premium.text.heading': {
    type: 'premium.text.heading',
    name: 'Título de Seção',
    description: 'Cabeçalho intermediário entre blocos',
    category: 'content',
    icon: Heading1,
    defaultLayout: { w: 12, h: 1, minW: 4, minH: 1 },
    defaultConfig: {
      title: 'Nova seção',
      eyebrow: 'Premium',
      accent: '#ff6e00',
      align: 'left',
    },
    renderer: HeadingBlock,
    propertyFields: [
      { kind: 'eyebrow' },
      { kind: 'title' },
      { kind: 'accent' },
      { kind: 'align' },
    ],
  },

  'premium.layout.divider': {
    type: 'premium.layout.divider',
    name: 'Divisor',
    description: 'Linha sutil entre seções',
    category: 'layout',
    icon: Minus,
    defaultLayout: { w: 12, h: 1, minW: 4, minH: 1 },
    defaultConfig: { accent: '#ffffff' },
    renderer: DividerBlock,
    propertyFields: [{ kind: 'accent' }],
  },

  'premium.layout.spacer': {
    type: 'premium.layout.spacer',
    name: 'Espaçador',
    description: 'Espaço vazio para arejar o layout',
    category: 'layout',
    icon: SpaceIcon,
    defaultLayout: { w: 12, h: 1, minW: 1, minH: 1 },
    defaultConfig: {},
    renderer: SpacerBlock,
    propertyFields: [],
  },
};

export const PREMIUM_BLOCK_LIST: PremiumBlockDefinition[] = Object.values(PREMIUM_BLOCK_REGISTRY);

export function getPremiumBlockDefinition(type: string): PremiumBlockDefinition | undefined {
  return PREMIUM_BLOCK_REGISTRY[type as PremiumBlockType];
}

export function createPremiumBlock(
  type: PremiumBlockType,
  position: { x: number; y: number },
): PremiumBlock {
  const def = PREMIUM_BLOCK_REGISTRY[type];
  if (!def) throw new Error(`Premium block ${type} não está no registry`);
  return {
    id: crypto.randomUUID(),
    type,
    layout: { ...def.defaultLayout, x: position.x, y: position.y },
    config: { ...def.defaultConfig },
  };
}
