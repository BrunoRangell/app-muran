import { MetricKey } from '@/types/template-editor';

// Dados fictícios de visão geral
export const mockOverview = {
  impressions: 158432,
  reach: 89234,
  clicks: 5243,
  ctr: 3.31,
  conversions: 342,
  spend: 4523.67,
  cpa: 13.23,
  cpc: 0.86
};

// Dados de série temporal (30 dias)
export const mockTimeSeries = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const baseImpressions = 4000 + Math.random() * 2000;
  const baseClicks = baseImpressions * (0.025 + Math.random() * 0.02);
  const baseConversions = baseClicks * (0.05 + Math.random() * 0.03);
  const baseSpend = 100 + Math.random() * 80;
  
  return {
    date: date.toISOString().split('T')[0],
    impressions: Math.round(baseImpressions),
    reach: Math.round(baseImpressions * 0.6),
    clicks: Math.round(baseClicks),
    conversions: Math.round(baseConversions),
    spend: parseFloat(baseSpend.toFixed(2)),
    ctr: parseFloat(((baseClicks / baseImpressions) * 100).toFixed(2)),
    cpc: parseFloat((baseSpend / baseClicks).toFixed(2)),
    cpa: parseFloat((baseSpend / baseConversions).toFixed(2))
  };
});

// Dados demográficos
export const mockDemographics = {
  age: [
    { range: '18-24', impressions: 28432, clicks: 1243, conversions: 45, spend: 823.50 },
    { range: '25-34', impressions: 52341, clicks: 2156, conversions: 124, spend: 1456.23 },
    { range: '35-44', impressions: 38765, clicks: 1432, conversions: 98, spend: 987.65 },
    { range: '45-54', impressions: 24532, clicks: 876, conversions: 52, spend: 654.32 },
    { range: '55-64', impressions: 12453, clicks: 412, conversions: 18, spend: 432.12 },
    { range: '65+', impressions: 5432, clicks: 124, conversions: 5, spend: 169.85 }
  ],
  gender: [
    { gender: 'Feminino', impressions: 89234, clicks: 3456, conversions: 198, spend: 2567.34 },
    { gender: 'Masculino', impressions: 69198, clicks: 1787, conversions: 144, spend: 1956.33 }
  ],
  location: [
    { city: 'São Paulo', state: 'SP', impressions: 45678, clicks: 1890, conversions: 112, spend: 1234.56 },
    { city: 'Rio de Janeiro', state: 'RJ', impressions: 32456, clicks: 1234, conversions: 78, spend: 876.43 },
    { city: 'Belo Horizonte', state: 'MG', impressions: 21345, clicks: 876, conversions: 45, spend: 543.21 },
    { city: 'Curitiba', state: 'PR', impressions: 18765, clicks: 654, conversions: 34, spend: 432.10 },
    { city: 'Porto Alegre', state: 'RS', impressions: 15432, clicks: 543, conversions: 28, spend: 321.09 }
  ]
};

// Campanhas fictícias
export const mockCampaigns = [
  {
    id: '1',
    name: 'Campanha de Conversão - Black Friday',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    impressions: 45678,
    clicks: 1890,
    conversions: 112,
    spend: 1234.56,
    ctr: 4.14,
    cpa: 11.02,
    platform: 'meta'
  },
  {
    id: '2',
    name: 'Remarketing - Carrinho Abandonado',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    impressions: 32456,
    clicks: 1567,
    conversions: 89,
    spend: 876.43,
    ctr: 4.83,
    cpa: 9.85,
    platform: 'meta'
  },
  {
    id: '3',
    name: 'Campanha de Tráfego - Blog',
    status: 'ACTIVE',
    objective: 'TRAFFIC',
    impressions: 28765,
    clicks: 1234,
    conversions: 45,
    spend: 543.21,
    ctr: 4.29,
    cpa: 12.07,
    platform: 'google'
  },
  {
    id: '4',
    name: 'Brand Awareness - Institucional',
    status: 'PAUSED',
    objective: 'AWARENESS',
    impressions: 65432,
    clicks: 876,
    conversions: 23,
    spend: 654.32,
    ctr: 1.34,
    cpa: 28.45,
    platform: 'meta'
  },
  {
    id: '5',
    name: 'Performance Max - E-commerce',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    impressions: 21345,
    clicks: 543,
    conversions: 67,
    spend: 432.10,
    ctr: 2.54,
    cpa: 6.45,
    platform: 'google'
  }
];

// Top criativos fictícios
export const mockCreatives = [
  {
    id: '1',
    name: 'Carrossel - Produtos em Destaque',
    thumbnail: null,
    impressions: 32456,
    clicks: 1567,
    conversions: 89,
    spend: 654.32,
    ctr: 4.83,
    platform: 'meta'
  },
  {
    id: '2',
    name: 'Vídeo - Depoimento Cliente',
    thumbnail: null,
    impressions: 28765,
    clicks: 1234,
    conversions: 67,
    spend: 543.21,
    ctr: 4.29,
    platform: 'meta'
  },
  {
    id: '3',
    name: 'Imagem - Promoção 30% OFF',
    thumbnail: null,
    impressions: 21345,
    clicks: 987,
    conversions: 54,
    spend: 432.10,
    ctr: 4.62,
    platform: 'meta'
  },
  {
    id: '4',
    name: 'Stories - Lançamento',
    thumbnail: null,
    impressions: 18765,
    clicks: 876,
    conversions: 43,
    spend: 321.09,
    ctr: 4.67,
    platform: 'meta'
  },
  {
    id: '5',
    name: 'Responsive Display',
    thumbnail: null,
    impressions: 15432,
    clicks: 654,
    conversions: 32,
    spend: 287.65,
    ctr: 4.24,
    platform: 'google'
  }
];

// Função auxiliar para formatar valores
export const formatMetricValue = (key: MetricKey, value: number): string => {
  switch (key) {
    case 'impressions':
    case 'reach':
    case 'clicks':
    case 'conversions':
      return value.toLocaleString('pt-BR');
    case 'spend':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    case 'ctr':
      return `${value.toFixed(2)}%`;
    case 'cpa':
    case 'cpc':
      return `R$ ${value.toFixed(2)}`;
    default:
      return value.toString();
  }
};

// Cores para métricas
export const METRIC_COLORS: Record<MetricKey, string> = {
  impressions: '#ff6e00',
  reach: '#6366f1',
  clicks: '#22c55e',
  ctr: '#f59e0b',
  conversions: '#8b5cf6',
  spend: '#ef4444',
  cpa: '#ec4899',
  cpc: '#14b8a6'
};
