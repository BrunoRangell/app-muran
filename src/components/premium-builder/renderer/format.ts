// Helpers de formatação compartilhados pelos blocos premium
import { MetricKey } from '@/types/template-editor';

export const fmtNum = (v: number) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(v || 0));

export const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export const fmtPct = (v: number) => `${(v || 0).toFixed(2)}%`;

export const formatMetric = (metric: MetricKey, value: number): string => {
  if (metric === 'spend' || metric === 'cpa' || metric === 'cpc' || metric === 'cpm') {
    return fmtCurrency(value);
  }
  if (metric === 'ctr') return fmtPct(value);
  if (metric === 'frequency') return (value || 0).toFixed(2);
  return fmtNum(value);
};

export const METRIC_LABEL: Record<MetricKey, string> = {
  impressions: 'Impressões',
  reach: 'Alcance',
  clicks: 'Cliques',
  ctr: 'CTR',
  conversions: 'Conversões',
  spend: 'Investimento',
  cpa: 'CPA',
  cpc: 'CPC',
  cpm: 'CPM',
  frequency: 'Frequência',
  videoViews: 'Views de Vídeo',
  messages: 'Mensagens',
};
