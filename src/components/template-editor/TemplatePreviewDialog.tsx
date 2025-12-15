import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplateWidget, DEFAULT_GRID_CONFIG, MetricKey } from '@/types/template-editor';
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

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: TemplateWidget[];
  templateName: string;
}

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

export function TemplatePreviewDialog({ 
  open, 
  onOpenChange, 
  widgets, 
  templateName 
}: TemplatePreviewDialogProps) {
  const { rowHeight, margin } = DEFAULT_GRID_CONFIG;
  const [marginX, marginY] = margin || [8, 8];

  // Calcular altura total do container baseada nos widgets
  const maxY = Math.max(0, ...widgets.map(w => w.layout.y + w.layout.h));
  const containerHeight = maxY * (rowHeight + marginY) + marginY * 2;

  // Calcular posição e tamanho de cada widget (espelha WidgetGridRenderer)
  const getWidgetStyle = (widget: TemplateWidget): React.CSSProperties => {
    const cols = 24;
    const colWidth = 100 / cols;
    
    return {
      position: 'absolute',
      left: `calc(${widget.layout.x * colWidth}% + ${marginX / 2}px)`,
      top: widget.layout.y * (rowHeight + marginY) + marginY,
      width: `calc(${widget.layout.w * colWidth}% - ${marginX}px)`,
      height: widget.layout.h * rowHeight + (widget.layout.h - 1) * marginY
    };
  };

  // Renderizar widget usando os MESMOS componentes do relatório real
  const renderWidgetContent = (widget: TemplateWidget) => {
    switch (widget.type) {
      case 'metric-card': {
        const metricKey = widget.config.metrics?.[0] as MetricKey || 'impressions';
        const metricData = mockOverviewData[metricKey];
        
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
        
        return (
          <ChartWidget
            chartType={chartType}
            metrics={metrics}
            timeSeries={mockTimeSeries}
            showLegend={widget.config.showLegend !== false}
            title={widget.config.title}
          />
        );
      }

      case 'pie-chart': {
        return (
          <PieChartWidget
            dataSource={widget.config.dataSource as any || 'gender'}
            demographics={mockDemographics}
            showLegend={widget.config.showLegend !== false}
            title={widget.config.title}
          />
        );
      }

      case 'campaigns-table':
      case 'simple-table': {
        return (
          <CampaignsTableWidget
            campaigns={mockCampaigns}
            limit={widget.config.limit || 10}
            title={widget.config.title}
          />
        );
      }

      case 'top-creatives': {
        return (
          <TopCreativesWidget
            creatives={mockCreatives}
            limit={widget.config.limit || 5}
            title={widget.config.title}
          />
        );
      }

      default:
        return (
          <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">Widget não reconhecido</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Preview: {templateName || 'Novo Template'}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-6">
            {widgets.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Adicione widgets ao template para visualizar o preview
              </div>
            ) : (
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
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
