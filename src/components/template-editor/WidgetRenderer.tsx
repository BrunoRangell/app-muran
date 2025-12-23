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
  Square
} from 'lucide-react';
import { TemplateWidget, WIDGET_CATALOG, MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { cn } from '@/lib/utils';
import {
  MetricCardWidget,
  ChartWidget,
  PieChartWidget,
  CampaignsTableWidget,
  TopCreativesWidget,
  TextBlockWidget,
  ImageBlockWidget,
  DividerWidget,
  SpacerWidget,
  BoxWidget
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
  Square
};

// Converter mock overview para formato esperado pelos widgets
const mockOverviewData = {
  impressions: { current: mockOverview.impressions, previous: mockOverview.impressions * 0.85, change: 12.5 },
  reach: { current: mockOverview.reach, previous: mockOverview.reach * 0.9, change: 8.3 },
  clicks: { current: mockOverview.clicks, previous: mockOverview.clicks * 0.88, change: 15.2 },
  ctr: { current: mockOverview.ctr, previous: mockOverview.ctr * 0.97, change: 3.1 },
  conversions: { current: mockOverview.conversions, previous: mockOverview.conversions * 0.82, change: 22.4 },
  spend: { current: mockOverview.spend, previous: mockOverview.spend * 0.94, change: 5.8 },
  cpa: { current: mockOverview.cpa, previous: mockOverview.cpa * 1.08, change: -8.7 },
  cpc: { current: mockOverview.cpc, previous: mockOverview.cpc * 1.04, change: -4.2 }
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
  
  // Gerar label amigável para o widget
  const getWidgetLabel = () => {
    if (widget.type === 'metric-card' && widget.config.metrics?.[0]) {
      const metricKey = widget.config.metrics[0] as MetricKey;
      return METRIC_LABELS[metricKey] || metricKey;
    }
    return widget.config.title || metadata?.name || 'Widget';
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
          />
        );
      }

      case 'pie-chart': {
        return (
          <PieChartWidget
            dataSource={widget.config.dataSource as any || 'gender'}
            demographics={mockDemographics}
            showLegend={widget.config.showLegend !== false}
          />
        );
      }

      case 'campaigns-table':
      case 'simple-table': {
        return (
          <CampaignsTableWidget
            campaigns={mockCampaigns}
            limit={widget.config.limit || 5}
          />
        );
      }

      case 'top-creatives': {
        return (
          <TopCreativesWidget
            creatives={mockCreatives}
            limit={widget.config.limit || 5}
          />
        );
      }

      // === CONTENT WIDGETS ===
      case 'text-block': {
        return (
          <TextBlockWidget
            text={widget.config.text}
            textAlign={widget.config.textAlign}
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
        // No editor, mostra guia visual
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
      onMouseUp={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "relative h-full w-full",
        isEditing && "cursor-pointer"
      )}
    >
      {/* Conteúdo do widget - renderiza EXATAMENTE como no preview/relatório */}
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
