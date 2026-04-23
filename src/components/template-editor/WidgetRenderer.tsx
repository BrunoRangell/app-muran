import React from 'react';
import { 
  LayoutGrid, 
  TrendingUp, 
  Users, 
  Table, 
  Image,
  CreditCard,
  LineChart,
  BarChart3,
  AreaChart,
  PieChart,
  Table2,
  Type,
  ImageIcon,
  Minus,
  Space,
  Square,
  Filter,
  GitCompare,
  LayoutList,
  Sparkles,
  LayoutPanelTop,
  BarChartHorizontal
} from 'lucide-react';
import { TemplateWidget, WIDGET_CATALOG, MetricKey, METRIC_LABELS, DimensionKey, RankingDataSource } from '@/types/template-editor';
import { cn } from '@/lib/utils';
import {
  MetricCardWidget,
  ChartWidget,
  PieChartWidget,
  CampaignsTableWidget,
  SimpleTableWidget,
  TopCreativesWidget,
  TextBlockWidget,
  ImageBlockWidget,
  DividerWidget,
  SpacerWidget,
  BoxWidget,
  FunnelWidget,
  ComboChartWidget,
  AdsTableWidget,
  PremiumKpiWidget,
  PlatformBlockWidget,
  RankingTableWidget,
} from '@/components/traffic-reports/widgets';
import { 
  mockOverview, 
  mockTimeSeries, 
  mockDemographics, 
  mockCampaigns, 
  mockCreatives 
} from '@/data/mockPreviewData';

interface WidgetRendererProps {
  widget: TemplateWidget;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

// Mapeamento de ícones
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  TrendingUp,
  Users,
  Table,
  Image,
  CreditCard,
  LineChart,
  BarChart3,
  AreaChart,
  PieChart,
  Table2,
  Type,
  ImageIcon,
  Minus,
  Space,
  Square,
  Filter,
  GitCompare,
  LayoutList,
  Sparkles,
  LayoutPanelTop,
  BarChartHorizontal,
};

// Converter mock overview para formato esperado pelos widgets
const mockOverviewData: Record<MetricKey, { current: number; previous: number; change: number }> = {
  impressions: { current: mockOverview.impressions, previous: mockOverview.impressions * 0.85, change: 12.5 },
  reach: { current: mockOverview.reach, previous: mockOverview.reach * 0.9, change: 8.3 },
  clicks: { current: mockOverview.clicks, previous: mockOverview.clicks * 0.88, change: 15.2 },
  ctr: { current: mockOverview.ctr, previous: mockOverview.ctr * 0.97, change: 3.1 },
  conversions: { current: mockOverview.conversions, previous: mockOverview.conversions * 0.82, change: 22.4 },
  spend: { current: mockOverview.spend, previous: mockOverview.spend * 0.94, change: 5.8 },
  cpa: { current: mockOverview.cpa, previous: mockOverview.cpa * 1.08, change: -8.7 },
  cpc: { current: mockOverview.cpc, previous: mockOverview.cpc * 1.04, change: -4.2 },
  cpm: { current: mockOverview.cpm, previous: mockOverview.cpm * 1.02, change: -2.1 },
  frequency: { current: mockOverview.frequency, previous: mockOverview.frequency * 0.95, change: 5.3 },
  videoViews: { current: mockOverview.videoViews, previous: mockOverview.videoViews * 0.88, change: 13.6 },
  messages: { current: mockOverview.messages, previous: mockOverview.messages * 0.91, change: 9.8 }
};

// Converter dados demográficos para formato de tabela
const getDimensionData = (dimension: DimensionKey) => {
  switch (dimension) {
    case 'campaigns':
      return mockCampaigns.map(c => ({ id: c.id, name: c.name, ...c }));
    case 'creatives':
      return mockCreatives.map(c => ({ id: c.id, name: c.name, ...c }));
    case 'age':
      return mockDemographics.age.map((item, idx) => ({ 
        id: `age-${idx}`, 
        name: item.range, 
        impressions: item.impressions,
        clicks: item.clicks,
        conversions: item.conversions,
        spend: item.spend,
        ctr: (item.clicks / item.impressions * 100)
      }));
    case 'gender':
      return mockDemographics.gender.map((item, idx) => ({ 
        id: `gender-${idx}`, 
        name: item.gender, 
        impressions: item.impressions,
        clicks: item.clicks,
        conversions: item.conversions,
        spend: item.spend,
        ctr: (item.clicks / item.impressions * 100)
      }));
    case 'location':
      return mockDemographics.location.map((item, idx) => ({ 
        id: `loc-${idx}`, 
        name: `${item.city}/${item.state}`, 
        impressions: item.impressions,
        clicks: item.clicks,
        conversions: item.conversions,
        spend: item.spend,
        ctr: (item.clicks / item.impressions * 100)
      }));
    default:
      return mockCampaigns.map(c => ({ id: c.id, name: c.name, ...c }));
  }
};

export function WidgetRenderer({ 
  widget, 
  isSelected, 
  isEditing,
  onSelect, 
  onRemove, 
  onDuplicate 
}: WidgetRendererProps) {
  const metadata = WIDGET_CATALOG.find(m => m.type === widget.type);
  const Icon = metadata ? ICON_MAP[metadata.icon] : LayoutGrid;
  
  // Determinar título a passar (respeitando showTitle)
  const getTitle = () => {
    if (widget.config.showTitle === false) return undefined;
    return widget.config.title || metadata?.name;
  };

  // Renderiza o conteúdo real do widget usando os mesmos componentes
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'metric-card': {
        const metricKey = widget.config.metrics?.[0] as MetricKey || 'impressions';
        const metricData = mockOverviewData[metricKey];
        
        return (
          <MetricCardWidget
            metric={metricKey}
            data={metricData}
            showComparison={widget.config.showComparison !== false}
          />
        );
      }

      case 'line-chart':
      case 'bar-chart':
      case 'area-chart': {
        const chartType = widget.type.replace('-chart', '') as 'line' | 'bar' | 'area';
        const metrics = (widget.config.metrics || ['impressions']) as MetricKey[];
        
        return (
          <ChartWidget
            chartType={chartType}
            metrics={metrics}
            timeSeries={mockTimeSeries.slice(-14)}
            showLegend={widget.config.showLegend !== false}
            title={getTitle()}
          />
        );
      }

      case 'pie-chart': {
        return (
          <PieChartWidget
            dimension={widget.config.dimension as DimensionKey || 'gender'}
            metric={widget.config.metrics?.[0] as MetricKey || 'impressions'}
            demographics={mockDemographics}
            showLegend={widget.config.showLegend !== false}
            title={getTitle()}
          />
        );
      }

      case 'campaigns-table': {
        return (
          <CampaignsTableWidget
            campaigns={mockCampaigns}
            limit={widget.config.limit || 5}
            title={getTitle()}
          />
        );
      }

      case 'simple-table': {
        const dimension = widget.config.dimension as DimensionKey || 'campaigns';
        const data = getDimensionData(dimension);
        
        return (
          <SimpleTableWidget
            data={data}
            dimension={dimension}
            metrics={widget.config.metrics as MetricKey[] || ['impressions', 'clicks', 'ctr']}
            limit={widget.config.limit || 10}
            title={getTitle()}
          />
        );
      }

      case 'top-creatives': {
        return (
          <TopCreativesWidget
            creatives={mockCreatives}
            metrics={widget.config.metrics as MetricKey[] || ['clicks', 'ctr']}
            limit={widget.config.limit || 5}
            title={getTitle()}
          />
        );
      }

      // === CONTENT WIDGETS ===
      case 'text-block': {
        return (
          <TextBlockWidget
            text={widget.config.text}
            textAlign={widget.config.textAlign}
            verticalAlign={widget.config.verticalAlign}
            fontSize={widget.config.fontSize}
            fontWeight={widget.config.fontWeight}
            textColor={widget.config.textColor}
          />
        );
      }

      case 'image-block': {
        return (
          <ImageBlockWidget
            imageUrl={widget.config.imageUrl}
            imageAlt={widget.config.imageAlt}
            objectFit={widget.config.objectFit}
            borderRadius={widget.config.borderRadius}
          />
        );
      }

      case 'divider': {
        return (
          <DividerWidget
            dividerStyle={widget.config.dividerStyle}
            dividerColor={widget.config.dividerColor}
            dividerThickness={widget.config.dividerThickness}
          />
        );
      }

      case 'spacer': {
        return <SpacerWidget showGuide={isEditing} />;
      }

      case 'box': {
        return (
          <BoxWidget
            text={widget.config.text}
            backgroundColor={widget.config.backgroundColor}
            borderColor={widget.config.borderColor}
            borderRadius={widget.config.borderRadius}
            padding={widget.config.padding}
            textAlign={widget.config.textAlign}
            fontSize={widget.config.fontSize as any}
            fontWeight={widget.config.fontWeight}
            textColor={widget.config.textColor}
          />
        );
      }

      // === NEW VISUAL WIDGETS ===
      case 'funnel-chart': {
        const funnelMetrics = (widget.config.funnelMetrics || ['impressions', 'clicks', 'conversions']) as MetricKey[];
        const steps = funnelMetrics.map(metric => ({
          metric,
          value: mockOverviewData[metric]?.current || 0
        }));
        
        return (
          <FunnelWidget
            steps={steps}
            showRates={widget.config.showRates !== false}
            title={getTitle()}
            colors={widget.config.colors}
          />
        );
      }

      case 'combo-chart': {
        return (
          <ComboChartWidget
            barMetric={(widget.config.barMetric || 'conversions') as MetricKey}
            lineMetric={(widget.config.lineMetric || 'cpa') as MetricKey}
            timeSeries={mockTimeSeries.slice(-14)}
            showLegend={widget.config.showLegend !== false}
            title={getTitle()}
          />
        );
      }

      case 'ads-table': {
        const mockAds = mockCreatives.map(c => ({
          id: c.id,
          name: c.name,
          thumbnail: c.thumbnail,
          status: 'ACTIVE' as const,
          platform: c.platform,
          metrics: {
            impressions: c.impressions,
            clicks: c.clicks,
            ctr: c.ctr,
            conversions: c.conversions,
            cpa: c.spend / (c.conversions || 1),
            spend: c.spend,
            cpc: c.spend / (c.clicks || 1),
            reach: Math.floor(c.impressions * 0.7),
            cpm: (c.spend / c.impressions) * 1000,
            frequency: 1.4,
            videoViews: Math.floor(c.impressions * 0.3),
            messages: Math.floor(c.conversions * 0.2)
          }
        }));
        
        return (
          <AdsTableWidget
            ads={mockAds}
            metrics={(widget.config.metrics as MetricKey[]) || ['impressions', 'clicks', 'ctr', 'conversions', 'cpa']}
            limit={widget.config.limit || 10}
            showThumbnails={widget.config.showThumbnails !== false}
            showProportionBars={widget.config.showProportionBars}
            proportionMetric={widget.config.proportionMetric as MetricKey}
            title={getTitle()}
          />
        );
      }

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className={cn(
                "w-12 h-12 mx-auto rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-primary/10 to-primary/5"
              )}>
                <Icon className="w-6 h-6 text-primary/60" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Widget não reconhecido
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (!isSelected) {
          e.stopPropagation();
          onSelect();
        }
      }}
      className={cn(
        "relative h-full w-full",
        isEditing && (isSelected ? "cursor-grab active:cursor-grabbing" : "cursor-pointer")
      )}
    >
      <div 
        className={cn(
          "h-full w-full rounded-lg overflow-hidden transition-all duration-200",
          "bg-card",
          isSelected && isEditing
            ? "border-2" 
            : "border border-border/50 hover:border-border"
        )}
        style={isSelected && isEditing ? {
          borderColor: '#ff6e00',
          boxShadow: '0 0 0 3px rgba(255, 110, 0, 0.12)'
        } : undefined}
      >
        {renderWidgetContent()}
      </div>
    </div>
  );
}
