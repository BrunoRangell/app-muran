import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2,
  LayoutGrid,
  TrendingUp,
  Users,
  LineChart,
  BarChart3,
  AreaChart,
  PieChart,
  CreditCard,
  Table2,
  Image,
  Loader2,
  GripVertical
} from 'lucide-react';
import { useWidgetPresets, WidgetPreset } from '@/hooks/useWidgetPresets';
import { TemplateWidget, WIDGET_CATALOG, METRIC_LABELS, MetricKey } from '@/types/template-editor';
import { cn } from '@/lib/utils';

interface PresetEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: WidgetPreset | null;
}

const ICON_OPTIONS = [
  { value: 'LayoutGrid', label: 'Grid', icon: LayoutGrid },
  { value: 'TrendingUp', label: 'Tendência', icon: TrendingUp },
  { value: 'Users', label: 'Usuários', icon: Users },
  { value: 'LineChart', label: 'Linha', icon: LineChart },
  { value: 'BarChart3', label: 'Barras', icon: BarChart3 },
  { value: 'AreaChart', label: 'Área', icon: AreaChart },
  { value: 'PieChart', label: 'Pizza', icon: PieChart },
  { value: 'CreditCard', label: 'Card', icon: CreditCard },
  { value: 'Table2', label: 'Tabela', icon: Table2 },
  { value: 'Image', label: 'Imagem', icon: Image },
];

const WIDGET_TYPES = WIDGET_CATALOG.filter(w => w.category === 'individual');

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  TrendingUp,
  Users,
  LineChart,
  BarChart3,
  AreaChart,
  PieChart,
  CreditCard,
  Table2,
  Image,
};

export function PresetEditorDialog({ open, onOpenChange, preset }: PresetEditorDialogProps) {
  const { createPreset, updatePreset } = useWidgetPresets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('LayoutGrid');
  const [widgets, setWidgets] = useState<TemplateWidget[]>([]);

  const isEditing = !!preset;

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setDescription(preset.description || '');
      setIcon(preset.icon);
      setWidgets(preset.widgets);
    } else {
      setName('');
      setDescription('');
      setIcon('LayoutGrid');
      setWidgets([]);
    }
  }, [preset, open]);

  const handleAddWidget = (type: string) => {
    const widgetMeta = WIDGET_CATALOG.find(w => w.type === type);
    if (!widgetMeta) return;

    const newWidget: TemplateWidget = {
      id: crypto.randomUUID(),
      type: type as any,
      layout: {
        x: 0,
        y: widgets.length * 4,
        w: widgetMeta.defaultLayout.w,
        h: widgetMeta.defaultLayout.h,
      },
      config: { ...widgetMeta.defaultConfig }
    };

    setWidgets([...widgets, newWidget]);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const handleUpdateWidgetConfig = (id: string, config: Partial<TemplateWidget['config']>) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, config: { ...w.config, ...config } } : w
    ));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (isEditing && preset) {
      updatePreset.mutate({
        id: preset.id,
        name,
        description,
        icon,
        widgets
      }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createPreset.mutate({
        name,
        description,
        icon,
        widgets
      }, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const isPending = createPreset.isPending || updatePreset.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Bloco Rápido' : 'Criar Bloco Rápido'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Métricas Principais"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(opt => {
                    const IconComp = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que este bloco contém..."
              rows={2}
            />
          </div>

          {/* Widgets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Widgets ({widgets.length})</Label>
              <Select onValueChange={handleAddWidget}>
                <SelectTrigger className="w-[200px]">
                  <Plus className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Adicionar widget" />
                </SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map(w => {
                    const IconComp = ICON_MAP[w.icon] || LayoutGrid;
                    return (
                      <SelectItem key={w.type} value={w.type}>
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4" />
                          {w.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {widgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <p>Nenhum widget adicionado.</p>
                <p className="text-sm">Use o seletor acima para adicionar widgets.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {widgets.map((widget, index) => {
                  const widgetMeta = WIDGET_CATALOG.find(w => w.type === widget.type);
                  const IconComp = ICON_MAP[widgetMeta?.icon || 'LayoutGrid'] || LayoutGrid;
                  
                  return (
                    <div
                      key={widget.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border bg-card",
                        "hover:bg-accent/30 transition-colors"
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-1 cursor-grab" />
                      
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10">
                        <IconComp className="w-4 h-4 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-medium">{widgetMeta?.name || widget.type}</p>
                        
                        {/* Config based on widget type */}
                        {widget.type === 'metric-card' && (
                          <Select 
                            value={widget.config.metrics?.[0] || 'impressions'}
                            onValueChange={(val) => handleUpdateWidgetConfig(widget.id, { metrics: [val as MetricKey] })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {['line-chart', 'bar-chart', 'area-chart'].includes(widget.type) && (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={widget.config.dataSource || 'timeSeries'}
                              onValueChange={(val) => handleUpdateWidgetConfig(widget.id, { dataSource: val as any })}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="timeSeries">Série Temporal</SelectItem>
                                <SelectItem value="demographics">Demografia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="text-[10px] text-muted-foreground">
                          Posição: ({widget.layout.x}, {widget.layout.y}) | 
                          Tamanho: {widget.layout.w}×{widget.layout.h}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
