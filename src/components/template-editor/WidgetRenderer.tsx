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
  Trash2,
  Copy,
  GripVertical
} from 'lucide-react';
import { TemplateWidget, WIDGET_CATALOG, MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  MetricCardWidget,
  ChartWidget,
  PieChartWidget,
  CampaignsTableWidget,
  TopCreativesWidget
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
  Table2
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
      onClick={onSelect}
      className={cn(
        "relative h-full w-full group",
        isEditing && "cursor-pointer"
      )}
    >
      {/* Conteúdo do widget - renderiza EXATAMENTE como no preview/relatório */}
      <div className={cn(
        "h-full w-full rounded-lg overflow-hidden transition-all duration-200",
        "bg-card border",
        isSelected 
          ? "border-primary shadow-lg ring-2 ring-primary/20" 
          : "border-border/50 hover:border-border"
      )}>
        {renderWidgetContent()}
      </div>

      {/* Toolbar flutuante externa - não afeta altura do widget */}
      {isEditing && (
        <div className={cn(
          "absolute -top-9 left-0 right-0 flex items-center justify-between px-1",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isSelected && "opacity-100"
        )}>
          {/* Label do widget + drag handle */}
          <div className="flex items-center gap-1.5 bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 border border-border/50 shadow-sm">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 cursor-grab" />
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
              {getWidgetLabel()}
            </span>
          </div>
          
          {/* Ações */}
          <div className="flex items-center gap-0.5 bg-card/95 backdrop-blur-sm rounded-md border border-border/50 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Indicador de seleção visual */}
      {isSelected && isEditing && (
        <div className="absolute inset-0 pointer-events-none rounded-lg border-2 border-primary" />
      )}
    </div>
  );
}
