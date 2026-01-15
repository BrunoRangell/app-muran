import { TemplateWidget, DEFAULT_GRID_CONFIG, MetricKey } from '@/types/template-editor';
import { v4 as uuidv4 } from 'uuid';

// Helper para criar widgets com IDs únicos
const createWidget = (
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  config: Record<string, any> = {}
): TemplateWidget => ({
  id: uuidv4(),
  type: type as any,
  layout: { x, y, w, h },
  config
});

// ============================================
// TEMPLATE 1: Performance Pro (Foco em Conversões)
// ============================================
export const performanceProTemplate: TemplateWidget[] = [
  // Header
  createWidget('text-block', 0, 0, 12, 1, {
    content: 'Relatório de Performance',
    textAlign: 'left',
    fontSize: 28,
    fontWeight: 'bold'
  }),
  
  // Divisor gradiente
  createWidget('divider', 0, 1, 12, 1, {
    style: 'gradient',
    color: '#ff6e00'
  }),
  
  // KPIs Principais - Foco em Conversão
  createWidget('metric-card', 0, 2, 3, 2, {
    metric: 'conversions' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'Conversões'
  }),
  createWidget('metric-card', 3, 2, 3, 2, {
    metric: 'cpa' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'Custo por Aquisição'
  }),
  createWidget('metric-card', 6, 2, 3, 2, {
    metric: 'spend' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'Investimento'
  }),
  createWidget('metric-card', 9, 2, 3, 2, {
    metric: 'ctr' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'Taxa de Cliques'
  }),
  
  // Funil + Gráfico Combinado (seção destaque)
  createWidget('funnel-chart', 0, 4, 5, 4, {
    funnelMetrics: ['impressions', 'clicks', 'conversions'] as MetricKey[],
    showRates: true,
    title: 'Funil de Conversão'
  }),
  createWidget('combo-chart', 5, 4, 7, 4, {
    barMetric: 'conversions' as MetricKey,
    lineMetric: 'cpa' as MetricKey,
    showLegend: true,
    title: 'Conversões vs CPA'
  }),
  
  // Métricas Secundárias
  createWidget('metric-card', 0, 8, 3, 2, {
    metric: 'impressions' as MetricKey,
    showComparison: true,
    title: 'Impressões'
  }),
  createWidget('metric-card', 3, 8, 3, 2, {
    metric: 'clicks' as MetricKey,
    showComparison: true,
    title: 'Cliques'
  }),
  createWidget('metric-card', 6, 8, 3, 2, {
    metric: 'cpc' as MetricKey,
    showComparison: true,
    title: 'Custo por Clique'
  }),
  createWidget('metric-card', 9, 8, 3, 2, {
    metric: 'cpm' as MetricKey,
    showComparison: true,
    title: 'CPM'
  }),
  
  // Gráficos de Tendência
  createWidget('area-chart', 0, 10, 6, 4, {
    metrics: ['conversions'] as MetricKey[],
    showLegend: false,
    title: 'Tendência de Conversões'
  }),
  createWidget('line-chart', 6, 10, 6, 4, {
    metrics: ['cpa', 'cpc'] as MetricKey[],
    showLegend: true,
    title: 'Evolução de Custos'
  }),
  
  // Divisor
  createWidget('divider', 0, 14, 12, 1, {
    style: 'solid'
  }),
  
  // Título da seção
  createWidget('text-block', 0, 15, 12, 1, {
    content: 'Performance por Campanha',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  
  // Tabela de Campanhas
  createWidget('campaigns-table', 0, 16, 12, 5, {
    limit: 10,
    title: ''
  }),
  
  // Título Anúncios
  createWidget('text-block', 0, 21, 12, 1, {
    content: 'Top Anúncios',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  
  // Tabela de Anúncios com barras
  createWidget('ads-table', 0, 22, 12, 5, {
    metrics: ['impressions', 'clicks', 'conversions', 'spend', 'cpa'] as MetricKey[],
    showThumbnails: true,
    showProportionBars: true,
    proportionMetric: 'conversions' as MetricKey,
    limit: 8,
    title: ''
  })
];

// ============================================
// TEMPLATE 2: Alcance & Brand (Foco em Awareness)
// ============================================
export const alcanceBrandTemplate: TemplateWidget[] = [
  // Header
  createWidget('text-block', 0, 0, 12, 1, {
    content: 'Relatório de Alcance & Brand',
    textAlign: 'left',
    fontSize: 28,
    fontWeight: 'bold'
  }),
  
  // Divisor
  createWidget('divider', 0, 1, 12, 1, {
    style: 'gradient',
    color: '#321e32'
  }),
  
  // KPIs de Alcance - 4 cards
  createWidget('metric-card', 0, 2, 3, 2, {
    metric: 'impressions' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'Impressões'
  }),
  createWidget('metric-card', 3, 2, 3, 2, {
    metric: 'reach' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'Alcance'
  }),
  createWidget('metric-card', 6, 2, 3, 2, {
    metric: 'frequency' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'Frequência'
  }),
  createWidget('metric-card', 9, 2, 3, 2, {
    metric: 'cpm' as MetricKey,
    showComparison: true,
    showAbsoluteChange: true,
    title: 'CPM'
  }),
  
  // Gráficos de Tendência Principal
  createWidget('combo-chart', 0, 4, 6, 4, {
    barMetric: 'impressions' as MetricKey,
    lineMetric: 'reach' as MetricKey,
    showLegend: true,
    title: 'Impressões vs Alcance'
  }),
  createWidget('combo-chart', 6, 4, 6, 4, {
    barMetric: 'impressions' as MetricKey,
    lineMetric: 'cpm' as MetricKey,
    showLegend: true,
    title: 'Impressões vs CPM'
  }),
  
  // Seção de Engajamento
  createWidget('line-chart', 0, 8, 4, 4, {
    metrics: ['clicks'] as MetricKey[],
    showLegend: false,
    title: 'Cliques ao Longo do Tempo'
  }),
  createWidget('area-chart', 4, 8, 4, 4, {
    metrics: ['ctr'] as MetricKey[],
    showLegend: false,
    title: 'Evolução do CTR'
  }),
  createWidget('pie-chart', 8, 8, 4, 4, {
    dimension: 'gender',
    metric: 'impressions' as MetricKey,
    showLegend: true,
    title: 'Impressões por Gênero'
  }),
  
  // Cards de Video e Mensagens
  createWidget('metric-card', 0, 12, 4, 2, {
    metric: 'videoViews' as MetricKey,
    showComparison: true,
    title: 'Visualizações de Vídeo'
  }),
  createWidget('metric-card', 4, 12, 4, 2, {
    metric: 'messages' as MetricKey,
    showComparison: true,
    title: 'Mensagens'
  }),
  createWidget('metric-card', 8, 12, 4, 2, {
    metric: 'spend' as MetricKey,
    showComparison: true,
    title: 'Investimento Total'
  }),
  
  // Divisor
  createWidget('divider', 0, 14, 12, 1, {
    style: 'dashed'
  }),
  
  // Demografia
  createWidget('text-block', 0, 15, 12, 1, {
    content: 'Análise Demográfica',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  
  createWidget('bar-chart', 0, 16, 4, 4, {
    metrics: ['impressions'] as MetricKey[],
    dataSource: 'age',
    showLegend: false,
    title: 'Impressões por Idade'
  }),
  createWidget('pie-chart', 4, 16, 4, 4, {
    dimension: 'gender',
    metric: 'reach' as MetricKey,
    showLegend: true,
    title: 'Alcance por Gênero'
  }),
  createWidget('pie-chart', 8, 16, 4, 4, {
    dimension: 'location',
    metric: 'impressions' as MetricKey,
    showLegend: true,
    title: 'Impressões por Região'
  }),
  
  // Tabela de Campanhas
  createWidget('text-block', 0, 20, 12, 1, {
    content: 'Campanhas de Alcance',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  createWidget('campaigns-table', 0, 21, 12, 5, {
    limit: 8,
    title: ''
  })
];

// ============================================
// TEMPLATE 3: E-commerce Analytics (Foco em Vendas)
// ============================================
export const ecommerceAnalyticsTemplate: TemplateWidget[] = [
  // Header Box Colorido
  createWidget('box', 0, 0, 12, 1, {
    backgroundColor: '#ff6e00',
    borderRadius: 8
  }),
  createWidget('text-block', 0, 0, 12, 1, {
    content: '📊 Analytics E-commerce',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold'
  }),
  
  // 6 KPIs em linha
  createWidget('metric-card', 0, 1, 2, 2, {
    metric: 'conversions' as MetricKey,
    showComparison: true,
    title: 'Conversões'
  }),
  createWidget('metric-card', 2, 1, 2, 2, {
    metric: 'cpa' as MetricKey,
    showComparison: true,
    title: 'CPA'
  }),
  createWidget('metric-card', 4, 1, 2, 2, {
    metric: 'spend' as MetricKey,
    showComparison: true,
    title: 'Investimento'
  }),
  createWidget('metric-card', 6, 1, 2, 2, {
    metric: 'ctr' as MetricKey,
    showComparison: true,
    title: 'CTR'
  }),
  createWidget('metric-card', 8, 1, 2, 2, {
    metric: 'cpc' as MetricKey,
    showComparison: true,
    title: 'CPC'
  }),
  createWidget('metric-card', 10, 1, 2, 2, {
    metric: 'cpm' as MetricKey,
    showComparison: true,
    title: 'CPM'
  }),
  
  // Divisor gradiente
  createWidget('divider', 0, 3, 12, 1, {
    style: 'gradient',
    color: '#ff6e00'
  }),
  
  // Funil + Gráfico Combinado Grande
  createWidget('funnel-chart', 0, 4, 4, 4, {
    funnelMetrics: ['impressions', 'clicks', 'conversions'] as MetricKey[],
    showRates: true,
    title: 'Funil de Vendas'
  }),
  createWidget('combo-chart', 4, 4, 8, 4, {
    barMetric: 'spend' as MetricKey,
    lineMetric: 'cpa' as MetricKey,
    showLegend: true,
    title: 'Investimento vs CPA ao Longo do Tempo'
  }),
  
  // 3 Gráficos de Tendência
  createWidget('line-chart', 0, 8, 4, 4, {
    metrics: ['conversions'] as MetricKey[],
    showLegend: false,
    title: 'Conversões Diárias'
  }),
  createWidget('area-chart', 4, 8, 4, 4, {
    metrics: ['spend'] as MetricKey[],
    showLegend: false,
    title: 'Investimento Acumulado'
  }),
  createWidget('line-chart', 8, 8, 4, 4, {
    metrics: ['cpa'] as MetricKey[],
    showLegend: false,
    title: 'Evolução do CPA'
  }),
  
  // Divisor
  createWidget('divider', 0, 12, 12, 1, {
    style: 'solid'
  }),
  
  // Seção Campanhas
  createWidget('text-block', 0, 13, 12, 1, {
    content: '🎯 Performance por Campanha',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  createWidget('campaigns-table', 0, 14, 12, 5, {
    limit: 10,
    title: ''
  }),
  
  // Seção Anúncios
  createWidget('text-block', 0, 19, 12, 1, {
    content: '🏆 Top Anúncios',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  createWidget('ads-table', 0, 20, 12, 5, {
    metrics: ['impressions', 'clicks', 'conversions', 'cpa', 'spend'] as MetricKey[],
    showThumbnails: true,
    showProportionBars: true,
    proportionMetric: 'spend' as MetricKey,
    limit: 8,
    title: ''
  }),
  
  // Seção Demografia
  createWidget('text-block', 0, 25, 12, 1, {
    content: '👥 Análise Demográfica',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  createWidget('bar-chart', 0, 26, 4, 4, {
    metrics: ['conversions'] as MetricKey[],
    dataSource: 'age',
    showLegend: false,
    title: 'Conversões por Idade'
  }),
  createWidget('pie-chart', 4, 26, 4, 4, {
    dimension: 'gender',
    metric: 'conversions' as MetricKey,
    showLegend: true,
    title: 'Conversões por Gênero'
  }),
  createWidget('pie-chart', 8, 26, 4, 4, {
    dimension: 'location',
    metric: 'spend' as MetricKey,
    showLegend: true,
    title: 'Investimento por Região'
  }),
  
  // Top Criativos
  createWidget('text-block', 0, 30, 12, 1, {
    content: '🎨 Top Criativos',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'semibold'
  }),
  createWidget('top-creatives', 0, 31, 12, 4, {
    metrics: ['conversions', 'cpa', 'ctr'] as MetricKey[],
    limit: 5,
    title: ''
  })
];

// ============================================
// Exportar templates com metadados
// ============================================
export interface PremiumTemplate {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'awareness' | 'ecommerce';
  icon: string;
  widgets: TemplateWidget[];
  gridConfig: typeof DEFAULT_GRID_CONFIG;
}

export const premiumTemplates: PremiumTemplate[] = [
  {
    id: 'performance-pro',
    name: 'Performance Pro',
    description: 'Template executivo focado em conversões e otimização de custos',
    category: 'performance',
    icon: '🎯',
    widgets: performanceProTemplate,
    gridConfig: DEFAULT_GRID_CONFIG
  },
  {
    id: 'alcance-brand',
    name: 'Alcance & Brand',
    description: 'Template para campanhas de awareness e reconhecimento de marca',
    category: 'awareness',
    icon: '📢',
    widgets: alcanceBrandTemplate,
    gridConfig: DEFAULT_GRID_CONFIG
  },
  {
    id: 'ecommerce-analytics',
    name: 'E-commerce Analytics',
    description: 'Template completo para análise de vendas e performance de loja',
    category: 'ecommerce',
    icon: '🛒',
    widgets: ecommerceAnalyticsTemplate,
    gridConfig: DEFAULT_GRID_CONFIG
  }
];

export default premiumTemplates;
