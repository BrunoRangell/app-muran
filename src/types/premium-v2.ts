// ===== Premium Builder v2 — Schema =====
// Engine isolado para templates premium editáveis. Não compartilha
// switch-case com o editor genérico. Tudo passa pelo registry central.

import type { MetricKey, RankingDataSource } from './template-editor';

export type PremiumEngine = 'premium-v2';

// Tipos de blocos premium. Namespace `premium.<categoria>.<variante>` evita
// colisão com widgets genéricos antigos.
export type PremiumBlockType =
  | 'premium.header.hero'
  | 'premium.metric.kpi'
  | 'premium.platform.summary'
  | 'premium.ranking.gradient'
  | 'premium.chart.donut'
  | 'premium.chart.trend'
  | 'premium.text.insight'
  | 'premium.text.heading'
  | 'premium.layout.divider'
  | 'premium.layout.spacer';

export type PremiumStyleVariant = 'default' | 'subtle' | 'bold' | 'glow';

export type PremiumChartSource = 'meta' | 'google' | 'combined';

export interface PremiumBlockLayout {
  // Grid 12 colunas
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// Configuração unificada de bloco premium. Todos os campos são opcionais —
// cada tipo usa apenas os relevantes (ver registry default).
export interface PremiumBlockConfig {
  // Conteúdo textual
  title?: string;
  subtitle?: string;
  text?: string;
  eyebrow?: string;            // Pequeno rótulo acima do título

  // Dados
  metric?: MetricKey;
  metrics?: MetricKey[];
  platform?: 'meta' | 'google';
  rankingSource?: RankingDataSource;
  chartSource?: PremiumChartSource;
  donutSource?: 'platform' | 'gender' | 'age';
  limit?: number;

  // Estilo
  accent?: string;             // hex
  variant?: PremiumStyleVariant;
  showComparison?: boolean;
  showLegend?: boolean;
  showTrend?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface PremiumBlock {
  id: string;
  type: PremiumBlockType;
  layout: PremiumBlockLayout;
  config: PremiumBlockConfig;
}

// Estrutura completa salva em `report_templates.sections`
export interface PremiumTemplateV2 {
  engine: PremiumEngine;        // 'premium-v2'
  version: 1;
  theme: 'dark';                // por enquanto apenas dark
  showSidebar: boolean;
  blocks: PremiumBlock[];
  meta?: {
    description?: string;
  };
}

// Helpers de detecção
export function isPremiumV2Template(sections: any): sections is PremiumTemplateV2 {
  return !!sections && sections.engine === 'premium-v2' && Array.isArray(sections.blocks);
}

// Configuração do grid premium
export const PREMIUM_GRID = {
  cols: 12,
  rowHeight: 80,
  marginX: 16,
  marginY: 16,
} as const;

// Helper para criar um novo bloco a partir do registry default
export function createPremiumBlockId(): string {
  return crypto.randomUUID();
}
