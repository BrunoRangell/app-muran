// Tipos de métricas disponíveis
export type MetricKey = 
  | 'impressions' 
  | 'reach' 
  | 'clicks' 
  | 'ctr'
  | 'conversions' 
  | 'spend' 
  | 'cpa' 
  | 'cpc';

// Tipos de gráficos
export type ChartType = 'line' | 'bar' | 'area' | 'pie';

// Fonte de dados
export type DataSource = 'timeSeries' | 'demographics' | 'campaigns' | 'creatives';

// Tipos de widgets disponíveis
export type WidgetType = 
  // Pré-configurados (blocos prontos)
  | 'overview-full'        // Visão geral completa (8 métricas)
  | 'trends-full'          // Todos os gráficos de tendência
  | 'demographics-full'    // Demografia completa
  | 'campaigns-table'      // Tabela de campanhas
  | 'top-creatives'        // Top criativos
  
  // Individuais (configuráveis)
  | 'metric-card'          // Card de métrica única
  | 'line-chart'           // Gráfico de linha
  | 'bar-chart'            // Gráfico de barras
  | 'area-chart'           // Gráfico de área
  | 'pie-chart'            // Gráfico de pizza
  | 'simple-table';        // Tabela simples

// Layout do widget no grid
export interface WidgetLayout {
  x: number;      // Posição X (coluna 0-11)
  y: number;      // Posição Y (linha)
  w: number;      // Largura (1-12 colunas)
  h: number;      // Altura (unidades de grid)
  minW?: number;  // Largura mínima
  minH?: number;  // Altura mínima
  maxW?: number;  // Largura máxima
  maxH?: number;  // Altura máxima
}

// Configuração específica do widget
export interface WidgetConfig {
  title?: string;                // Título personalizado
  metrics?: MetricKey[];         // Métricas selecionadas
  chartType?: ChartType;         // Tipo de gráfico (para widgets de gráfico)
  dataSource?: DataSource;       // Fonte de dados
  limit?: number;                // Limite de itens (para tabelas/listas)
  showLegend?: boolean;          // Mostrar legenda
  showComparison?: boolean;      // Mostrar comparação com período anterior
  colors?: string[];             // Cores personalizadas
  showTitle?: boolean;           // Mostrar título do widget
}

// Widget completo
export interface TemplateWidget {
  id: string;                    // UUID único
  type: WidgetType;              // Tipo do widget
  layout: WidgetLayout;          // Posição e tamanho
  config: WidgetConfig;          // Configurações
}

// Configuração do grid
export interface GridConfig {
  cols: number;                  // Número de colunas (padrão: 12)
  rowHeight: number;             // Altura de cada linha em pixels
  margin?: [number, number];     // Margem entre widgets [x, y]
  containerPadding?: [number, number]; // Padding do container
}

// Template completo (estrutura para salvar no banco)
export interface TemplateData {
  widgets: TemplateWidget[];
  gridConfig: GridConfig;
  version?: number;              // Versão do formato para migração
}

// Metadados dos widgets para exibição na paleta
export interface WidgetMetadata {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;                  // Nome do ícone Lucide
  category: 'preset' | 'individual';
  defaultLayout: Omit<WidgetLayout, 'x' | 'y'>;
  defaultConfig: WidgetConfig;
}

// Catálogo de widgets disponíveis
export const WIDGET_CATALOG: WidgetMetadata[] = [
  // Pré-configurados
  {
    type: 'overview-full',
    name: 'Visão Geral Completa',
    description: 'Grid com todas as métricas principais (impressões, cliques, conversões, etc.)',
    icon: 'LayoutGrid',
    category: 'preset',
    defaultLayout: { w: 12, h: 2, minW: 6, minH: 2 },
    defaultConfig: { showTitle: true, title: 'Visão Geral' }
  },
  {
    type: 'trends-full',
    name: 'Gráficos de Tendência',
    description: 'Todos os gráficos de tendência ao longo do tempo',
    icon: 'TrendingUp',
    category: 'preset',
    defaultLayout: { w: 12, h: 4, minW: 8, minH: 3 },
    defaultConfig: { showTitle: true, title: 'Tendências' }
  },
  {
    type: 'demographics-full',
    name: 'Demografia Completa',
    description: 'Gráficos de idade, gênero e localização',
    icon: 'Users',
    category: 'preset',
    defaultLayout: { w: 12, h: 3, minW: 8, minH: 2 },
    defaultConfig: { showTitle: true, title: 'Demografia' }
  },
  {
    type: 'campaigns-table',
    name: 'Tabela de Campanhas',
    description: 'Tabela detalhada com todas as campanhas',
    icon: 'Table',
    category: 'preset',
    defaultLayout: { w: 12, h: 3, minW: 8, minH: 2 },
    defaultConfig: { showTitle: true, title: 'Campanhas' }
  },
  {
    type: 'top-creatives',
    name: 'Top Criativos',
    description: 'Melhores anúncios com preview visual',
    icon: 'Image',
    category: 'preset',
    defaultLayout: { w: 12, h: 3, minW: 6, minH: 2 },
    defaultConfig: { showTitle: true, title: 'Top Criativos', limit: 5 }
  },
  
  // Individuais
  {
    type: 'metric-card',
    name: 'Card de Métrica',
    description: 'Exibe uma métrica individual com destaque',
    icon: 'CreditCard',
    category: 'individual',
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1 },
    defaultConfig: { metrics: ['impressions'], showComparison: true }
  },
  {
    type: 'line-chart',
    name: 'Gráfico de Linha',
    description: 'Visualiza tendências ao longo do tempo',
    icon: 'LineChart',
    category: 'individual',
    defaultLayout: { w: 6, h: 2, minW: 4, minH: 2 },
    defaultConfig: { metrics: ['impressions', 'clicks'], showLegend: true, chartType: 'line' }
  },
  {
    type: 'bar-chart',
    name: 'Gráfico de Barras',
    description: 'Compara valores entre categorias',
    icon: 'BarChart3',
    category: 'individual',
    defaultLayout: { w: 6, h: 2, minW: 4, minH: 2 },
    defaultConfig: { metrics: ['conversions'], showLegend: true, chartType: 'bar' }
  },
  {
    type: 'area-chart',
    name: 'Gráfico de Área',
    description: 'Mostra volume acumulado ao longo do tempo',
    icon: 'AreaChart',
    category: 'individual',
    defaultLayout: { w: 6, h: 2, minW: 4, minH: 2 },
    defaultConfig: { metrics: ['spend'], showLegend: true, chartType: 'area' }
  },
  {
    type: 'pie-chart',
    name: 'Gráfico de Pizza',
    description: 'Mostra distribuição proporcional',
    icon: 'PieChart',
    category: 'individual',
    defaultLayout: { w: 4, h: 2, minW: 3, minH: 2 },
    defaultConfig: { dataSource: 'demographics', showLegend: true, chartType: 'pie' }
  },
  {
    type: 'simple-table',
    name: 'Tabela Simples',
    description: 'Tabela customizável com métricas selecionadas',
    icon: 'Table2',
    category: 'individual',
    defaultLayout: { w: 6, h: 2, minW: 4, minH: 2 },
    defaultConfig: { metrics: ['impressions', 'clicks', 'ctr'], limit: 10 }
  }
];

// Labels das métricas para exibição
export const METRIC_LABELS: Record<MetricKey, string> = {
  impressions: 'Impressões',
  reach: 'Alcance',
  clicks: 'Cliques',
  ctr: 'CTR',
  conversions: 'Conversões',
  spend: 'Investimento',
  cpa: 'CPA',
  cpc: 'CPC'
};

// Helper para criar um novo widget
export function createWidget(
  type: WidgetType, 
  position: { x: number; y: number }
): TemplateWidget {
  const metadata = WIDGET_CATALOG.find(w => w.type === type);
  if (!metadata) {
    throw new Error(`Widget type "${type}" not found in catalog`);
  }
  
  return {
    id: crypto.randomUUID(),
    type,
    layout: {
      ...metadata.defaultLayout,
      x: position.x,
      y: position.y
    },
    config: { ...metadata.defaultConfig }
  };
}

// Configuração padrão do grid
export const DEFAULT_GRID_CONFIG: GridConfig = {
  cols: 12,
  rowHeight: 100,
  margin: [16, 16],
  containerPadding: [16, 16]
};

// Template padrão vazio
export const DEFAULT_TEMPLATE_DATA: TemplateData = {
  widgets: [],
  gridConfig: DEFAULT_GRID_CONFIG,
  version: 1
};
