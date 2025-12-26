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

// Dimensões para gráficos/tabelas
export type DimensionKey = 'age' | 'gender' | 'location' | 'campaigns' | 'creatives';

// Tipos de presets (expandem em múltiplos widgets ao adicionar)
export type PresetType =
  | 'overview-full'        // Visão geral completa (8 métricas)
  | 'trends-full'          // Todos os gráficos de tendência
  | 'demographics-full';   // Demografia completa

// Tipos de widgets disponíveis (agora todos são editáveis)
export type WidgetType = 
  // Individuais (todos configuráveis)
  | 'metric-card'          // Card de métrica única
  | 'line-chart'           // Gráfico de linha
  | 'bar-chart'            // Gráfico de barras
  | 'area-chart'           // Gráfico de área
  | 'pie-chart'            // Gráfico de pizza
  | 'simple-table'         // Tabela simples
  | 'campaigns-table'      // Tabela de campanhas
  | 'top-creatives'        // Top criativos
  // Widgets de conteúdo
  | 'text-block'           // Bloco de texto (título, parágrafo)
  | 'image-block'          // Imagem com URL ou upload
  | 'divider'              // Divisor horizontal
  | 'spacer'               // Espaçador invisível
  | 'box';                 // Caixa decorativa

// Tipo combinado para uso na paleta e em alguns componentes
export type WidgetOrPresetType = WidgetType | PresetType;

// Layout do widget no grid (24 colunas)
export interface WidgetLayout {
  x: number;      // Posição X (coluna 0-23)
  y: number;      // Posição Y (linha)
  w: number;      // Largura (1-24 colunas)
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
  dimension?: DimensionKey;      // Dimensão para agrupamento (pie, table)
  limit?: number;                // Limite de itens (para tabelas/listas)
  showLegend?: boolean;          // Mostrar legenda
  showComparison?: boolean;      // Mostrar comparação com período anterior
  colors?: string[];             // Cores personalizadas
  showTitle?: boolean;           // Mostrar título do widget
  // Configurações de widgets de conteúdo
  text?: string;                 // Texto/conteúdo (text-block)
  textAlign?: 'left' | 'center' | 'right';  // Alinhamento do texto
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';  // Tamanho da fonte
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';  // Peso da fonte
  textColor?: string;            // Cor do texto
  imageUrl?: string;             // URL da imagem (image-block)
  imageAlt?: string;             // Alt text da imagem
  objectFit?: 'cover' | 'contain' | 'fill';  // Ajuste da imagem
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';  // Raio da borda
  dividerStyle?: 'solid' | 'dashed' | 'dotted' | 'gradient';  // Estilo do divisor
  dividerColor?: string;         // Cor do divisor
  dividerThickness?: number;     // Espessura do divisor (px)
  backgroundColor?: string;      // Cor de fundo (box)
  borderColor?: string;          // Cor da borda (box)
  padding?: 'none' | 'sm' | 'md' | 'lg';  // Padding interno (box)
  verticalPadding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';  // Padding vertical (text-block)
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
  type: WidgetType | PresetType;
  name: string;
  description: string;
  icon: string;                  // Nome do ícone Lucide
  category: 'preset' | 'individual' | 'content';
  defaultLayout: Omit<WidgetLayout, 'x' | 'y'>;
  defaultConfig: WidgetConfig;
}

// Catálogo de widgets disponíveis (grid 12 colunas)
export const WIDGET_CATALOG: WidgetMetadata[] = [
  // Pré-configurados (expandem em múltiplos widgets)
  {
    type: 'overview-full',
    name: 'Visão Geral Completa',
    description: 'Adiciona 8 cards de métricas lado a lado (editáveis individualmente)',
    icon: 'LayoutGrid',
    category: 'preset',
    defaultLayout: { w: 12, h: 2, minW: 6, minH: 2 },
    defaultConfig: { showTitle: true, title: 'Visão Geral' }
  },
  {
    type: 'trends-full',
    name: 'Gráficos de Tendência',
    description: 'Adiciona 4 gráficos de linha/área (editáveis individualmente)',
    icon: 'TrendingUp',
    category: 'preset',
    defaultLayout: { w: 12, h: 4, minW: 8, minH: 3 },
    defaultConfig: { showTitle: true, title: 'Tendências' }
  },
  {
    type: 'demographics-full',
    name: 'Demografia Completa',
    description: 'Adiciona gráficos de idade, gênero e localização (editáveis individualmente)',
    icon: 'Users',
    category: 'preset',
    defaultLayout: { w: 12, h: 3, minW: 8, minH: 2 },
    defaultConfig: { showTitle: true, title: 'Demografia' }
  },
  
  // Individuais
  {
    type: 'metric-card',
    name: 'Card de Métrica',
    description: 'Exibe uma métrica individual com destaque',
    icon: 'CreditCard',
    category: 'individual',
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultConfig: { metrics: ['impressions'], showComparison: true }
  },
  {
    type: 'line-chart',
    name: 'Gráfico de Linha',
    description: 'Visualiza tendências ao longo do tempo',
    icon: 'LineChart',
    category: 'individual',
    defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: { metrics: ['impressions', 'clicks'], showLegend: true, chartType: 'line' }
  },
  {
    type: 'bar-chart',
    name: 'Gráfico de Barras',
    description: 'Compara valores entre categorias',
    icon: 'BarChart3',
    category: 'individual',
    defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: { metrics: ['conversions'], showLegend: true, chartType: 'bar' }
  },
  {
    type: 'area-chart',
    name: 'Gráfico de Área',
    description: 'Mostra volume acumulado ao longo do tempo',
    icon: 'AreaChart',
    category: 'individual',
    defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: { metrics: ['spend'], showLegend: true, chartType: 'area' }
  },
  {
    type: 'pie-chart',
    name: 'Gráfico de Pizza',
    description: 'Mostra distribuição proporcional',
    icon: 'PieChart',
    category: 'individual',
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: { dimension: 'gender', metrics: ['impressions'], showLegend: true, chartType: 'pie' }
  },
  {
    type: 'simple-table',
    name: 'Tabela Simples',
    description: 'Tabela customizável com métricas selecionadas',
    icon: 'Table2',
    category: 'individual',
    defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: { dimension: 'campaigns', metrics: ['impressions', 'clicks', 'ctr'], limit: 10 }
  },
  {
    type: 'campaigns-table',
    name: 'Tabela de Campanhas',
    description: 'Tabela detalhada com campanhas ativas',
    icon: 'Table',
    category: 'individual',
    defaultLayout: { w: 12, h: 5, minW: 6, minH: 3 },
    defaultConfig: { showTitle: true, title: 'Campanhas', limit: 10 }
  },
  {
    type: 'top-creatives',
    name: 'Top Criativos',
    description: 'Melhores anúncios com preview visual',
    icon: 'Image',
    category: 'individual',
    defaultLayout: { w: 12, h: 5, minW: 6, minH: 3 },
    defaultConfig: { showTitle: true, title: 'Top Criativos', metrics: ['clicks', 'ctr'], limit: 5 }
  },
  
  // Widgets de Conteúdo
  {
    type: 'text-block',
    name: 'Texto',
    description: 'Título ou parágrafo de texto customizável',
    icon: 'Type',
    category: 'content',
    defaultLayout: { w: 6, h: 1, minW: 2, minH: 1 },
    defaultConfig: { 
      text: 'Digite seu texto aqui', 
      textAlign: 'left', 
      fontSize: 'lg', 
      fontWeight: 'semibold',
      verticalPadding: 'sm'
    }
  },
  {
    type: 'image-block',
    name: 'Imagem',
    description: 'Adicione uma imagem (logo, banner, etc)',
    icon: 'ImageIcon',
    category: 'content',
    defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
    defaultConfig: { 
      imageUrl: '', 
      imageAlt: 'Imagem', 
      objectFit: 'contain',
      borderRadius: 'md'
    }
  },
  {
    type: 'divider',
    name: 'Divisor',
    description: 'Linha horizontal para separar seções',
    icon: 'Minus',
    category: 'content',
    defaultLayout: { w: 12, h: 1, minW: 4, minH: 1, maxH: 1 },
    defaultConfig: { 
      dividerStyle: 'solid', 
      dividerColor: 'hsl(var(--border))', 
      dividerThickness: 1 
    }
  },
  {
    type: 'spacer',
    name: 'Espaçador',
    description: 'Espaço vazio para ajustar layout',
    icon: 'Space',
    category: 'content',
    defaultLayout: { w: 12, h: 1, minW: 1, minH: 1 },
    defaultConfig: {}
  },
  {
    type: 'box',
    name: 'Caixa',
    description: 'Container decorativo com fundo colorido',
    icon: 'Square',
    category: 'content',
    defaultLayout: { w: 6, h: 2, minW: 2, minH: 1 },
    defaultConfig: { 
      backgroundColor: 'hsl(var(--primary) / 0.05)',
      borderRadius: 'lg',
      padding: 'md',
      text: 'Conteúdo da caixa'
    }
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

// Todas as métricas disponíveis em ordem
export const ALL_METRICS: MetricKey[] = ['impressions', 'reach', 'clicks', 'ctr', 'conversions', 'spend', 'cpa', 'cpc'];

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

// Helper para expandir um preset em múltiplos widgets individuais (grid 12 colunas)
export function expandPresetToWidgets(
  presetType: PresetType, 
  startY: number
): TemplateWidget[] {
  const widgets: TemplateWidget[] = [];
  
  switch (presetType) {
    case 'overview-full': {
      // 8 cards de métrica em 2 linhas de 4 (cada card = 3 colunas de 12)
      ALL_METRICS.forEach((metric, index) => {
        widgets.push({
          id: crypto.randomUUID(),
          type: 'metric-card',
          layout: {
            x: (index % 4) * 3,  // 4 cards por linha, cada um com 3 colunas
            y: startY + Math.floor(index / 4) * 2,
            w: 3,
            h: 2,
            minW: 2,
            minH: 2
          },
          config: {
            metrics: [metric],
            showComparison: true
          }
        });
      });
      break;
    }
    
    case 'trends-full': {
      // 4 gráficos de tendência: 2 por linha (cada um = 6 colunas de 12)
      const trendMetrics: { metrics: MetricKey[]; type: 'line-chart' | 'area-chart' }[] = [
        { metrics: ['impressions', 'reach'], type: 'line-chart' },
        { metrics: ['clicks'], type: 'line-chart' },
        { metrics: ['conversions'], type: 'area-chart' },
        { metrics: ['spend'], type: 'area-chart' }
      ];
      
      trendMetrics.forEach((config, index) => {
        widgets.push({
          id: crypto.randomUUID(),
          type: config.type,
          layout: {
            x: (index % 2) * 6,  // 2 colunas de largura 6
            y: startY + Math.floor(index / 2) * 4,
            w: 6,
            h: 4,
            minW: 4,
            minH: 3
          },
          config: {
            metrics: config.metrics,
            showLegend: true,
            chartType: config.type === 'line-chart' ? 'line' : 'area',
            title: METRIC_LABELS[config.metrics[0]]
          }
        });
      });
      break;
    }
    
    case 'demographics-full': {
      // 3 widgets: idade (bar), gênero (pie), localização (table) - 4 colunas cada
      widgets.push(
        {
          id: crypto.randomUUID(),
          type: 'bar-chart',
          layout: { x: 0, y: startY, w: 4, h: 4, minW: 3, minH: 3 },
          config: {
            title: 'Idade',
            dataSource: 'demographics',
            showLegend: false,
            chartType: 'bar'
          }
        },
        {
          id: crypto.randomUUID(),
          type: 'pie-chart',
          layout: { x: 4, y: startY, w: 4, h: 4, minW: 3, minH: 3 },
          config: {
            title: 'Gênero',
            dataSource: 'demographics',
            showLegend: true,
            chartType: 'pie'
          }
        },
        {
          id: crypto.randomUUID(),
          type: 'simple-table',
          layout: { x: 8, y: startY, w: 4, h: 4, minW: 3, minH: 3 },
          config: {
            title: 'Localização',
            dataSource: 'demographics',
            limit: 5
          }
        }
      );
      break;
    }
  }
  
  return widgets;
}

// Verifica se é um tipo de preset
export function isPresetType(type: string): type is PresetType {
  return ['overview-full', 'trends-full', 'demographics-full'].includes(type);
}

// Configuração padrão do grid (12 colunas com células maiores ~80px)
export const DEFAULT_GRID_CONFIG: GridConfig = {
  cols: 12,
  rowHeight: 80,
  margin: [12, 12],
  containerPadding: [20, 20]
};

// Template padrão vazio
export const DEFAULT_TEMPLATE_DATA: TemplateData = {
  widgets: [],
  gridConfig: DEFAULT_GRID_CONFIG,
  version: 1
};
