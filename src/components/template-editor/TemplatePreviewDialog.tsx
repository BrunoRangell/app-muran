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
import { TemplateWidget, DEFAULT_GRID_CONFIG } from '@/types/template-editor';
import {
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
  const { rowHeight, margin } = DEFAULT_GRID_CONFIG;
  const [marginX, marginY] = margin || [16, 16];

  // Agrupar widgets por linha Y para calcular altura total
  const maxY = Math.max(0, ...widgets.map(w => w.layout.y + w.layout.h));

  const renderWidgetContent = (widget: TemplateWidget) => {
    switch (widget.type) {
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

  // Calcular posição e tamanho absolutos baseados no grid
  const getWidgetStyle = (widget: TemplateWidget): React.CSSProperties => {
    const colWidth = 100 / 12; // porcentagem por coluna
    
    return {
      position: 'absolute',
      left: `calc(${widget.layout.x * colWidth}% + ${marginX / 2}px)`,
      top: widget.layout.y * (rowHeight + marginY) + marginY / 2,
      width: `calc(${widget.layout.w * colWidth}% - ${marginX}px)`,
      height: widget.layout.h * rowHeight + (widget.layout.h - 1) * marginY
    };
  };

  // Altura total do container
  const containerHeight = maxY * (rowHeight + marginY) + marginY;

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
          <div className="p-4">
            {widgets.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Adicione widgets ao template para visualizar o preview
              </div>
            ) : (
              <div 
                className="relative w-full"
                style={{ height: containerHeight }}
              >
                {widgets.map((widget) => (
                  <div 
                    key={widget.id}
                    className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
                    style={getWidgetStyle(widget)}
                  >
                    {widget.config.showTitle !== false && widget.config.title && (
                      <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                        <h3 className="text-sm font-medium">{widget.config.title}</h3>
                      </div>
                    )}
                    <div className="h-full overflow-hidden">
                      {renderWidgetContent(widget)}
                    </div>
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
