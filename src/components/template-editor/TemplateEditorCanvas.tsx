import React, { useCallback } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { TemplateWidget } from '@/types/template-editor';
import { WidgetRenderer } from './WidgetRenderer';
import { cn } from '@/lib/utils';
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

export function TemplateEditorCanvas({
  widgets,
  layout,
  selectedWidgetId,
  onLayoutChange,
  onSelectWidget,
  onRemoveWidget,
  onDuplicateWidget
}: TemplateEditorCanvasProps) {
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    onLayoutChange(newLayout);
  }, [onLayoutChange]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Deselecionar se clicar no canvas vazio
    if (e.target === e.currentTarget) {
      onSelectWidget(null);
    }
  }, [onSelectWidget]);

  if (widgets.length === 0) {
    return (
      <div 
        className={cn(
          "h-full flex items-center justify-center",
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
    );
  }

  return (
    <div 
      className={cn(
        "h-full overflow-auto rounded-lg",
        "bg-muted/10 border border-border"
      )}
      onClick={handleCanvasClick}
    >
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={100}
        width={1200}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".cursor-grab"
        isResizable={true}
        isDraggable={true}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map(widget => (
          <div key={widget.id} className="widget-container">
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
  );
}
