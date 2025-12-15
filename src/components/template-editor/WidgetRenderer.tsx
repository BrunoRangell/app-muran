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
import { TemplateWidget, WIDGET_CATALOG, MetricKey } from '@/types/template-editor';
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
  
  const title = widget.config.title || metadata?.name || 'Widget';

  // Renderiza o conteúdo real do widget usando os mesmos componentes
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'metric-card': {
        const metricKey = widget.config.metrics?.[0] as MetricKey || 'impressions';
        const metricData = mockOverviewData[metricKey];
        
        return (
          <div className="p-2 h-full">
            <MetricCardWidget
              metric={metricKey}
              data={metricData}
              showComparison={widget.config.showComparison !== false}
            />
          </div>
        );
      }

      case 'line-chart':
      case 'bar-chart':
      case 'area-chart': {
        const chartType = widget.type.replace('-chart', '') as 'line' | 'bar' | 'area';
        const metrics = (widget.config.metrics || ['impressions']) as MetricKey[];
        
        return (
          <div className="h-full">
            <ChartWidget
              chartType={chartType}
              metrics={metrics}
              timeSeries={mockTimeSeries.slice(-14)}
              showLegend={widget.config.showLegend !== false}
            />
          </div>
        );
      }

      case 'pie-chart': {
        return (
          <div className="h-full">
            <PieChartWidget
              dataSource={widget.config.dataSource as any || 'gender'}
              demographics={mockDemographics}
              showLegend={widget.config.showLegend !== false}
            />
          </div>
        );
      }

      case 'campaigns-table':
      case 'simple-table': {
        return (
          <div className="h-full overflow-hidden">
            <CampaignsTableWidget
              campaigns={mockCampaigns}
              limit={widget.config.limit || 5}
            />
          </div>
        );
      }

      case 'top-creatives': {
        return (
          <div className="h-full overflow-hidden">
            <TopCreativesWidget
              creatives={mockCreatives}
              limit={widget.config.limit || 5}
            />
          </div>
        );
      }

      default:
        return (
          <div className="flex-1 flex items-center justify-center">
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
        "h-full w-full rounded-lg border-2 transition-all duration-200",
        "bg-card flex flex-col overflow-hidden",
        isSelected 
          ? "border-primary shadow-lg ring-2 ring-primary/20" 
          : "border-border/50 hover:border-border",
        isEditing && "cursor-pointer"
      )}
    >
      {/* Header com ações */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-b border-border/50",
        "bg-muted/30 flex-shrink-0"
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab flex-shrink-0" />
          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {title}
          </span>
        </div>
        
        {isEditing && (
          <div className={cn(
            "flex items-center gap-1 flex-shrink-0 transition-opacity",
            !isSelected && "opacity-50 hover:opacity-100"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Conteúdo do widget com visualização real */}
      <div className="flex-1 overflow-hidden min-h-0">
        {renderWidgetContent()}
      </div>
    </div>
  );
}
