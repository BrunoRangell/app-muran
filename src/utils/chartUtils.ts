import { formatCurrency, formatNumber, formatPercentage } from './formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cores do tema Muran
export const CHART_COLORS = {
  primary: 'hsl(var(--muran-primary))',
  secondary: 'hsl(var(--muran-secondary))',
  accent: 'hsl(var(--accent))',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#4285f4',
  meta: '#ff6e00',
  google: '#4285f4',
};

// Formatadores de data
export const formatChartDate = (dateString: string, formatType: 'short' | 'long' = 'short'): string => {
  try {
    const date = new Date(dateString);
    if (formatType === 'short') {
      return format(date, 'dd/MM', { locale: ptBR });
    }
    return format(date, 'dd MMM yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
};

// Calculadores de métricas
export const calculateCTR = (clicks: number, impressions: number): number => {
  if (!impressions || impressions === 0) return 0;
  return (clicks / impressions) * 100;
};

export const calculateConversionRate = (conversions: number, clicks: number): number => {
  if (!clicks || clicks === 0) return 0;
  return (conversions / clicks) * 100;
};

export const calculateCPA = (spend: number, conversions: number): number => {
  if (!conversions || conversions === 0) return 0;
  return spend / conversions;
};

export const calculateCPC = (spend: number, clicks: number): number => {
  if (!clicks || clicks === 0) return 0;
  return spend / clicks;
};

// Processadores de dados para agregação
export const calculateMovingAverage = (data: number[], window: number = 7): number[] => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(avg);
  }
  return result;
};

// Formatadores para tooltips
export const formatTooltipValue = (value: number, type: 'currency' | 'number' | 'percentage'): string => {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value / 100);
    case 'number':
      return formatNumber(value);
    default:
      return String(value);
  }
};

// Calcular percentual em relação ao total
export const calculatePercentage = (value: number, total: number): number => {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
};

// Exportar funções de formatação já existentes
export { formatCurrency, formatNumber, formatPercentage };
