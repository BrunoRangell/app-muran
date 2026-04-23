import React from 'react';
import { TemplateWidget, MetricKey, RankingDataSource, DEFAULT_GRID_CONFIG } from '@/types/template-editor';
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
  BoxWidget,
  FunnelWidget,
  ComboChartWidget,
  AdsTableWidget,
  PremiumKpiWidget,
  PlatformBlockWidget,
  RankingTableWidget,
} from './widgets';
import { SidebarNav } from './premium-templates/dashcortex/SidebarNav';

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
    cpm: { current: number; previous: number; change: number };
    frequency: { current: number; previous: number; change: number };
    videoViews: { current: number; previous: number; change: number };
    messages: { current: number; previous: number; change: number };
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
  premiumTheme?: boolean;
}

export function WidgetGridRenderer({ widgets, data, premiumTheme = false }: WidgetGridRendererProps) {
  const { cols, rowHeight } = DEFAULT_GRID_CONFIG;
  const marginX = 12;
  const marginY = 12;

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
        // No relatório final, espaçador é invisível
        return <SpacerWidget showGuide={false} />;
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
          value: data.overview?.[metric]?.current || 0
        }));
        
        return (
          <FunnelWidget
            steps={steps}
            showRates={widget.config.showRates !== false}
            title={widget.config.title}
            colors={widget.config.colors}
          />
        );
      }

      case 'combo-chart': {
        if (!data.timeSeries?.length) return <EmptyState message="Sem dados de série temporal" />;
        
        return (
          <ComboChartWidget
            barMetric={(widget.config.barMetric || 'conversions') as MetricKey}
            lineMetric={(widget.config.lineMetric || 'cpa') as MetricKey}
            timeSeries={data.timeSeries}
            showLegend={widget.config.showLegend !== false}
            title={widget.config.title}
          />
        );
      }

      case 'ads-table': {
        if (!data.topAds?.length) return <EmptyState message="Sem dados de anúncios" />;
        
        return (
          <AdsTableWidget
            ads={data.topAds}
            metrics={(widget.config.metrics as MetricKey[]) || ['impressions', 'clicks', 'ctr', 'conversions', 'cpa']}
            limit={widget.config.limit || 10}
            showThumbnails={widget.config.showThumbnails !== false}
            showProportionBars={widget.config.showProportionBars}
            proportionMetric={widget.config.proportionMetric as MetricKey}
            title={widget.config.title}
          />
        );
      }

      // === PREMIUM WIDGETS (dark theme) ===
      case 'premium-kpi': {
        const metricKey = (widget.config.metrics?.[0] as MetricKey) || 'impressions';
        const metricData = data.overview?.[metricKey];
        return (
          <PremiumKpiWidget
            metric={metricKey}
            data={metricData}
            accent={widget.config.accent}
            showComparison={widget.config.showComparison !== false}
            title={widget.config.title}
          />
        );
      }

      case 'platform-block': {
        const platform = (widget.config.platform || 'meta') as 'meta' | 'google';
        const platformData =
          platform === 'meta'
            ? (data as any).metaData ?? (data.platform === 'meta' ? data : null)
            : (data as any).googleData ?? (data.platform === 'google' ? data : null);

        return (
          <PlatformBlockWidget
            platform={platform}
            accent={widget.config.accent}
            mainMetric={(widget.config.mainMetric as MetricKey) || 'spend'}
            sideMetrics={(widget.config.sideMetrics as MetricKey[]) || ['clicks', 'conversions', 'cpa']}
            chartMetric={(widget.config.chartMetric as MetricKey) || 'spend'}
            title={widget.config.title}
            timeSeries={platformData?.timeSeries || []}
            overview={platformData?.overview || data.overview}
          />
        );
      }

      case 'ranking-table': {
        return (
          <RankingTableWidget
            dataSource={(widget.config.rankingDataSource as RankingDataSource) || 'regions'}
            metric={(widget.config.metrics?.[0] as MetricKey) || 'conversions'}
            accent={widget.config.accent}
            limit={widget.config.limit || 8}
            title={widget.config.title}
            demographics={data.demographics}
            campaigns={data.campaigns}
            topAds={data.topAds}
          />
        );
      }

      default:
        return <EmptyState message="Widget não reconhecido" />;
    }
  };

  if (widgets.length === 0) {
    return (
      <div className={premiumTheme ? "flex items-center justify-center py-12 text-white/40" : "flex items-center justify-center py-12 text-muted-foreground"}>
        Nenhum widget configurado no template
      </div>
    );
  }

  const grid = (
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

  if (premiumTheme) {
    return (
      <div
        className="dashcortex-root w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6"
        style={{ background: '#0B0F1A' }}
      >
        <style>{`
          .dashcortex-root { font-family: 'Space Grotesk', -apple-system, sans-serif; }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="flex gap-6 max-w-[1600px] mx-auto">
          <SidebarNav active="overview" />
          <div className="flex-1 min-w-0">{grid}</div>
        </div>
      </div>
    );
  }

  return grid;
}

// Componente para estados vazios
function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
