import React, { useCallback, useState } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { TemplateWidget } from '@/types/template-editor';
import { WidgetRenderer } from './WidgetRenderer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface TemplateEditorCanvasProps {
  widgets: TemplateWidget[];
  layout: Layout[];
  selectedWidgetId: string | null;
  onLayoutChange: (layout: Layout[]) => void;
  onSelectWidget: (id: string | null) => void;
  onRemoveWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
}

const ZOOM_LEVELS = [50, 75, 100, 125, 150];

export function TemplateEditorCanvas({
  widgets,
  layout,
  selectedWidgetId,
  onLayoutChange,
  onSelectWidget,
  onRemoveWidget,
  onDuplicateWidget
}: TemplateEditorCanvasProps) {
  const [zoom, setZoom] = useState(100);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    onLayoutChange(newLayout);
  }, [onLayoutChange]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectWidget(null);
    }
  }, [onSelectWidget]);

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  if (widgets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Zoom controls */}
        <div className="flex-shrink-0 mb-3 flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" disabled className="h-8 px-3">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">100%</span>
          <Button variant="outline" size="sm" disabled className="h-8 px-3">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div 
          className={cn(
            "flex-1 flex items-center justify-center",
            "border-2 border-dashed border-border rounded-lg",
            "bg-muted/20"
          )}
          onClick={handleCanvasClick}
        >
          <div className="text-center px-6 py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-primary/40" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Canvas vazio
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Adicione widgets clicando nos itens da paleta à esquerda para começar a construir seu template
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Grid configuration - 12 colunas com células maiores para melhor UX
  const cols = 12;
  const rowHeight = 80; // Aumentado de 40 para 80
  const margin: [number, number] = [12, 12]; // Aumentado de 8 para 12
  const containerPadding: [number, number] = [20, 48]; // [horizontal, vertical] - vertical maior para toolbar flutuante
  const baseWidth = 1200;
  const gridWidth = baseWidth * (zoom / 100);
  
  // Fórmula exata do react-grid-layout
  const colWidth = (baseWidth - containerPadding[0] - containerPadding[1] - margin[0] * (cols - 1)) / cols;
  
  // Para o grid visual
  const cellWidth = colWidth + margin[0];
  const cellHeight = rowHeight + margin[1];

  return (
    <div className="h-full flex flex-col">
      {/* Zoom controls */}
      <div className="flex-shrink-0 mb-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {widgets.length} widget{widgets.length !== 1 ? 's' : ''} no canvas
        </span>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut}
            disabled={zoom === ZOOM_LEVELS[0]}
            className="h-8 px-2"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleZoomReset}
            className="h-8 px-3 min-w-[60px]"
          >
            {zoom}%
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomIn}
            disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            className="h-8 px-2"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomReset}
            className="h-8 px-2 ml-1"
            title="Resetar zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas com scroll e zoom */}
      <div 
        className={cn(
          "flex-1 overflow-auto rounded-lg",
          "border border-border bg-muted/5"
        )}
        onClick={handleCanvasClick}
      >
        <div 
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${100 / (zoom / 100)}%`,
            minWidth: baseWidth,
          }}
        >
          <div
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${cellWidth}px ${cellHeight}px`,
              backgroundPosition: `${containerPadding[0]}px ${containerPadding[1]}px`,
              backgroundColor: 'hsl(var(--background))'
            }}
          >
            <GridLayout
              className="layout"
              layout={layout}
              cols={cols}
              rowHeight={rowHeight}
              width={baseWidth}
              margin={margin}
              containerPadding={containerPadding}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".cursor-grab"
              isResizable={true}
              isDraggable={true}
              compactType="vertical"
              preventCollision={false}
            >
              {widgets.map(widget => (
                <div key={widget.id} className="widget-container h-full overflow-visible">
                  <WidgetRenderer
                    widget={widget}
                    isSelected={selectedWidgetId === widget.id}
                    isEditing={true}
                    onSelect={() => onSelectWidget(widget.id)}
                    onRemove={() => onRemoveWidget(widget.id)}
                    onDuplicate={() => onDuplicateWidget(widget.id)}
                  />
                </div>
              ))}
            </GridLayout>
          </div>
        </div>
      </div>
    </div>
  );
}
