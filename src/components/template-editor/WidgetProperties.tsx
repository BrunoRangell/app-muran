import React from 'react';
import { Settings, X } from 'lucide-react';
import { TemplateWidget, WIDGET_CATALOG, METRIC_LABELS, MetricKey } from '@/types/template-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface WidgetPropertiesProps {
  widget: TemplateWidget | null;
  onUpdateConfig: (config: Partial<TemplateWidget['config']>) => void;
  onClose: () => void;
}

const ALL_METRICS: MetricKey[] = [
  'impressions', 'reach', 'clicks', 'ctr', 
  'conversions', 'spend', 'cpa', 'cpc'
];

export function WidgetProperties({ widget, onUpdateConfig, onClose }: WidgetPropertiesProps) {
  if (!widget) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Settings className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          Selecione um widget para editar suas propriedades
        </p>
      </div>
    );
  }

  const metadata = WIDGET_CATALOG.find(m => m.type === widget.type);
  const isPreset = metadata?.category === 'preset';
  const supportsMetrics = !isPreset && widget.type !== 'pie-chart';

  const handleMetricToggle = (metric: MetricKey, checked: boolean) => {
    const currentMetrics = widget.config.metrics || [];
    const newMetrics = checked
      ? [...currentMetrics, metric]
      : currentMetrics.filter(m => m !== metric);
    onUpdateConfig({ metrics: newMetrics });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Propriedades</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {metadata?.name}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="widget-title">Título</Label>
          <Input
            id="widget-title"
            value={widget.config.title || ''}
            onChange={(e) => onUpdateConfig({ title: e.target.value })}
            placeholder={metadata?.name}
          />
        </div>

        {/* Mostrar título */}
        <div className="flex items-center justify-between">
          <Label htmlFor="show-title">Exibir título</Label>
          <Switch
            id="show-title"
            checked={widget.config.showTitle !== false}
            onCheckedChange={(checked) => onUpdateConfig({ showTitle: checked })}
          />
        </div>

        <Separator />

        {/* Métricas (apenas para widgets individuais) */}
        {supportsMetrics && (
          <div className="space-y-3">
            <Label>Métricas</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_METRICS.map(metric => (
                <label
                  key={metric}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border cursor-pointer",
                    "hover:bg-accent/50 transition-colors",
                    widget.config.metrics?.includes(metric) 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                >
                  <Checkbox
                    checked={widget.config.metrics?.includes(metric) || false}
                    onCheckedChange={(checked) => handleMetricToggle(metric, !!checked)}
                  />
                  <span className="text-sm">{METRIC_LABELS[metric]}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Mostrar legenda (para gráficos) */}
        {['line-chart', 'bar-chart', 'area-chart', 'pie-chart'].includes(widget.type) && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="show-legend">Exibir legenda</Label>
              <Switch
                id="show-legend"
                checked={widget.config.showLegend !== false}
                onCheckedChange={(checked) => onUpdateConfig({ showLegend: checked })}
              />
            </div>
          </>
        )}

        {/* Mostrar comparação (para cards de métrica) */}
        {widget.type === 'metric-card' && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="show-comparison">Comparar com período anterior</Label>
              <Switch
                id="show-comparison"
                checked={widget.config.showComparison !== false}
                onCheckedChange={(checked) => onUpdateConfig({ showComparison: checked })}
              />
            </div>
          </>
        )}

        {/* Limite de itens (para tabelas e listas) */}
        {['simple-table', 'top-creatives', 'campaigns-table'].includes(widget.type) && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="limit">Limite de itens</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                max={50}
                value={widget.config.limit || 10}
                onChange={(e) => onUpdateConfig({ limit: parseInt(e.target.value) || 10 })}
              />
            </div>
          </>
        )}

        {/* Info para widgets pré-configurados */}
        {isPreset && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Este é um bloco pré-configurado. Ele exibe automaticamente todos os dados relevantes da seção.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
