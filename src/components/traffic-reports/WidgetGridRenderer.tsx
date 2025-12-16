import React from 'react';
import { TemplateWidget, MetricKey, DEFAULT_GRID_CONFIG } from '@/types/template-editor';
import { 
  MetricCardWidget, 
  ChartWidget, 
  PieChartWidget, 
  CampaignsTableWidget, 
  TopCreativesWidget 
} from './widgets';

interface InsightsData {
  overview?: {
    impressions: { current: number; previous: number; change: number };
    reach: { current: number; previous: number; change: number };
    clicks: { current: number; previous: number; change: number };
    ctr: { current: number; previous: number; change: number };
    conversions: { current: number; previous: number; change: number };
    spend: { current: number; previous: number; change: number };
    cpa: { current: number; previous: number; change: number };
    cpc: { current: number; previous: number; change: number };
  };
  timeSeries?: any[];
  demographics?: any;
  campaigns?: any[];
  topAds?: any[];
  platform?: 'meta' | 'google' | 'both';
}

interface WidgetGridRendererProps {
  widgets: TemplateWidget[];
  data: InsightsData;
}

export function WidgetGridRenderer({ widgets, data }: WidgetGridRendererProps) {
  const { cols, rowHeight, margin } = DEFAULT_GRID_CONFIG;
  const [marginX, marginY] = margin || [12, 12];

  // Calcular altura total do grid baseada nos widgets
  const maxY = Math.max(0, ...widgets.map(w => w.layout.y + w.layout.h));
  const containerHeight = maxY * (rowHeight + marginY) + marginY * 2;

  // Calcular posição e tamanho de cada widget
  const getWidgetStyle = (widget: TemplateWidget): React.CSSProperties => {
    const colWidth = 100 / cols;
    
    return {
      position: 'absolute',
      left: `calc(${widget.layout.x * colWidth}% + ${marginX / 2}px)`,
      top: widget.layout.y * (rowHeight + marginY) + marginY,
      width: `calc(${widget.layout.w * colWidth}% - ${marginX}px)`,
      height: widget.layout.h * rowHeight + (widget.layout.h - 1) * marginY
    };
  };

  // Renderizar widget baseado no tipo
  const renderWidgetContent = (widget: TemplateWidget) => {
    switch (widget.type) {
      case 'metric-card': {
        const metricKey = widget.config.metrics?.[0] as MetricKey || 'impressions';
        const metricData = data.overview?.[metricKey];
        
        if (!metricData) return <EmptyState message="Métrica não disponível" />;
        
        return (
          <MetricCardWidget
            metric={metricKey}
            data={metricData}
            showComparison={widget.config.showComparison !== false}
            title={widget.config.title}
          />
        );
      }

      case 'line-chart':
      case 'bar-chart':
      case 'area-chart': {
        const chartType = widget.type.replace('-chart', '') as 'line' | 'bar' | 'area';
        const metrics = (widget.config.metrics || ['impressions']) as MetricKey[];
        
        if (!data.timeSeries?.length) return <EmptyState message="Sem dados de série temporal" />;
        
        return (
          <ChartWidget
            chartType={chartType}
            metrics={metrics}
            timeSeries={data.timeSeries}
            showLegend={widget.config.showLegend !== false}
            title={widget.config.title}
          />
        );
      }

      case 'pie-chart': {
        if (!data.demographics) return <EmptyState message="Sem dados demográficos" />;
        
        return (
          <PieChartWidget
            dataSource={widget.config.dataSource as any || 'gender'}
            demographics={data.demographics}
            showLegend={widget.config.showLegend !== false}
            title={widget.config.title}
          />
        );
      }

      case 'campaigns-table':
      case 'simple-table': {
        if (!data.campaigns?.length) return <EmptyState message="Sem dados de campanhas" />;
        
        return (
          <CampaignsTableWidget
            campaigns={data.campaigns}
            limit={widget.config.limit || 10}
            title={widget.config.title}
          />
        );
      }

      case 'top-creatives': {
        if (!data.topAds?.length) return <EmptyState message="Sem dados de criativos" />;
        
        return (
          <TopCreativesWidget
            creatives={data.topAds}
            limit={widget.config.limit || 5}
            title={widget.config.title}
          />
        );
      }

      default:
        return <EmptyState message="Widget não reconhecido" />;
    }
  };

  if (widgets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Nenhum widget configurado no template
      </div>
    );
  }

  return (
    <div 
      className="relative w-full"
      style={{ minHeight: containerHeight }}
    >
      {widgets.map((widget) => (
        <div 
          key={widget.id}
          className="overflow-hidden"
          style={getWidgetStyle(widget)}
        >
          {renderWidgetContent(widget)}
        </div>
      ))}
    </div>
  );
}

// Componente para estados vazios
function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
