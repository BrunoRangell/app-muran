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
  GripVertical,
  Sparkles
} from 'lucide-react';
import { WIDGET_CATALOG, WidgetType, WidgetMetadata, PresetType } from '@/types/template-editor';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { WidgetPreviewThumbnail } from './WidgetPreviewThumbnail';
import { Badge } from '@/components/ui/badge';

interface WidgetPaletteProps {
  onAddWidget: (type: WidgetType | PresetType) => void;
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

function WidgetPaletteItem({ 
  widget, 
  onAdd,
  isPreset = false
}: { 
  widget: WidgetMetadata; 
  onAdd: () => void;
  isPreset?: boolean;
}) {
  const Icon = ICON_MAP[widget.icon] || LayoutGrid;
  
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          onClick={onAdd}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg",
            "bg-card hover:bg-accent/50 border border-border/50",
            "transition-all duration-200 hover:shadow-md hover:border-primary/30",
            "text-left group cursor-grab active:cursor-grabbing",
            isPreset && "bg-gradient-to-r from-primary/5 to-transparent"
          )}
        >
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-gradient-to-br from-primary/10 to-primary/5",
            "group-hover:from-primary/20 group-hover:to-primary/10",
            "transition-colors"
          )}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">
                {widget.name}
              </p>
              {isPreset && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  Auto
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {widget.description}
            </p>
          </div>
          <GripVertical className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start" 
        className="w-auto p-2"
        sideOffset={8}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Preview</p>
          <WidgetPreviewThumbnail type={widget.type as WidgetType} />
          {isPreset && (
            <p className="text-[10px] text-muted-foreground/80 italic">
              Clique para adicionar múltiplos widgets editáveis
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function WidgetPalette({ onAddWidget }: WidgetPaletteProps) {
  const presetWidgets = WIDGET_CATALOG.filter(w => w.category === 'preset');
  const individualWidgets = WIDGET_CATALOG.filter(w => w.category === 'individual');

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Widgets</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Clique para adicionar ao canvas
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Pré-configurados */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Blocos Rápidos
          </h4>
          <p className="text-[10px] text-muted-foreground/70 mb-3">
            Adiciona múltiplos widgets que você pode editar ou excluir individualmente
          </p>
          <div className="space-y-2">
            {presetWidgets.map(widget => (
              <WidgetPaletteItem
                key={widget.type}
                widget={widget}
                onAdd={() => onAddWidget(widget.type as PresetType)}
                isPreset
              />
            ))}
          </div>
        </div>
        
        {/* Individuais */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Widgets Individuais
          </h4>
          <div className="space-y-2">
            {individualWidgets.map(widget => (
              <WidgetPaletteItem
                key={widget.type}
                widget={widget}
                onAdd={() => onAddWidget(widget.type as WidgetType)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
