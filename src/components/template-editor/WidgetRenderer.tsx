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
import { TemplateWidget, WIDGET_CATALOG, METRIC_LABELS } from '@/types/template-editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const metricsLabel = widget.config.metrics?.map(m => METRIC_LABELS[m]).join(', ');

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
        "bg-muted/30"
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab flex-shrink-0" />
          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {title}
          </span>
        </div>
        
        {isEditing && isSelected && (
          <div className="flex items-center gap-1 flex-shrink-0">
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
      
      {/* Conteúdo do widget (placeholder) */}
      <div className="flex-1 p-3 flex items-center justify-center">
        <div className="text-center">
          <div className={cn(
            "w-12 h-12 mx-auto rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-primary/10 to-primary/5"
          )}>
            <Icon className="w-6 h-6 text-primary/60" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {metadata?.category === 'preset' 
              ? 'Bloco pré-configurado' 
              : metricsLabel || 'Configure as métricas'}
          </p>
        </div>
      </div>
    </div>
  );
}
