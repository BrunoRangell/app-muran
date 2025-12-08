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
import { TemplateWidget } from '@/types/template-editor';
import {
  OverviewPreview,
  TrendsPreview,
  DemographicsPreview,
  TopCreativesPreview,
  CampaignsTablePreview,
  MetricCardPreview,
  ChartPreview,
  PieChartPreview,
  TablePreview
} from './widget-previews';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: TemplateWidget[];
  templateName: string;
}

export function TemplatePreviewDialog({ 
  open, 
  onOpenChange, 
  widgets, 
  templateName 
}: TemplatePreviewDialogProps) {
  // Ordenar widgets por posição Y e depois X
  const sortedWidgets = [...widgets].sort((a, b) => {
    if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
    return a.layout.x - b.layout.x;
  });

  const renderWidgetContent = (widget: TemplateWidget) => {
    switch (widget.type) {
      case 'overview-full':
        return <OverviewPreview />;
      case 'trends-full':
        return <TrendsPreview />;
      case 'demographics-full':
        return <DemographicsPreview />;
      case 'campaigns-table':
        return <CampaignsTablePreview />;
      case 'top-creatives':
        return <TopCreativesPreview limit={widget.config.limit} />;
      case 'metric-card':
        return (
          <MetricCardPreview 
            metric={widget.config.metrics?.[0] || 'impressions'} 
            showComparison={widget.config.showComparison}
          />
        );
      case 'line-chart':
        return (
          <ChartPreview 
            chartType="line" 
            metrics={widget.config.metrics || ['impressions']}
            showLegend={widget.config.showLegend}
          />
        );
      case 'bar-chart':
        return (
          <ChartPreview 
            chartType="bar" 
            metrics={widget.config.metrics || ['conversions']}
            showLegend={widget.config.showLegend}
          />
        );
      case 'area-chart':
        return (
          <ChartPreview 
            chartType="area" 
            metrics={widget.config.metrics || ['spend']}
            showLegend={widget.config.showLegend}
          />
        );
      case 'pie-chart':
        return (
          <PieChartPreview 
            dataSource={widget.config.dataSource}
            showLegend={widget.config.showLegend}
          />
        );
      case 'simple-table':
        return (
          <TablePreview 
            metrics={widget.config.metrics}
            limit={widget.config.limit}
          />
        );
      default:
        return null;
    }
  };

  // Calcular altura baseada no layout
  const getWidgetHeight = (widget: TemplateWidget) => {
    const baseHeight = 100; // rowHeight
    return widget.layout.h * baseHeight;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
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
          <div className="p-6 space-y-4">
            {sortedWidgets.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Adicione widgets ao template para visualizar o preview
              </div>
            ) : (
              sortedWidgets.map((widget) => (
                <div 
                  key={widget.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                  style={{ height: getWidgetHeight(widget) }}
                >
                  {widget.config.showTitle !== false && widget.config.title && (
                    <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
                      <h3 className="text-sm font-medium">{widget.config.title}</h3>
                    </div>
                  )}
                  <div className="h-full">
                    {renderWidgetContent(widget)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
