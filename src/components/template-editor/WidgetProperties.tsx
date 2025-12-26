import React from 'react';
import { Settings, X, Copy, Trash2 } from 'lucide-react';
import { TemplateWidget, WIDGET_CATALOG, METRIC_LABELS, MetricKey, DimensionKey } from '@/types/template-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface WidgetPropertiesProps {
  widget: TemplateWidget | null;
  onUpdateConfig: (config: Partial<TemplateWidget['config']>) => void;
  onClose: () => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
}

const ALL_METRICS: MetricKey[] = [
  'impressions', 'reach', 'clicks', 'ctr', 
  'conversions', 'spend', 'cpa', 'cpc'
];

// Métricas disponíveis para gráfico de pizza (valores absolutos)
const PIE_METRICS: MetricKey[] = ['impressions', 'clicks', 'conversions', 'spend'];

// Dimensões disponíveis
const DIMENSION_LABELS: Record<DimensionKey, string> = {
  age: 'Idade',
  gender: 'Gênero',
  location: 'Localização',
  campaigns: 'Campanhas',
  creatives: 'Criativos'
};

// Dimensões para gráfico de pizza (apenas demográficas)
const PIE_DIMENSIONS: DimensionKey[] = ['age', 'gender', 'location'];

// Dimensões para tabela simples
const TABLE_DIMENSIONS: DimensionKey[] = ['campaigns', 'creatives', 'age', 'gender', 'location'];

// Métricas para top criativos
const CREATIVE_METRICS: MetricKey[] = ['impressions', 'clicks', 'ctr', 'conversions', 'spend', 'cpa', 'cpc'];

export function WidgetProperties({ widget, onUpdateConfig, onClose, onRemove, onDuplicate }: WidgetPropertiesProps) {
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
  const isContentWidget = metadata?.category === 'content';
  
  // Widgets que usam seleção múltipla de métricas
  const supportsMultipleMetrics = ['line-chart', 'bar-chart', 'area-chart', 'simple-table', 'top-creatives'].includes(widget.type);

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
        {/* === WIDGETS DE CONTEÚDO === */}
        
        {/* Text Block */}
        {widget.type === 'text-block' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="text-content">Texto</Label>
              <Textarea
                id="text-content"
                value={widget.config.text || ''}
                onChange={(e) => onUpdateConfig({ text: e.target.value })}
                placeholder="Digite seu texto aqui..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tamanho</Label>
                <Select 
                  value={widget.config.fontSize || 'lg'}
                  onValueChange={(value) => onUpdateConfig({ fontSize: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Pequeno</SelectItem>
                    <SelectItem value="base">Normal</SelectItem>
                    <SelectItem value="lg">Grande</SelectItem>
                    <SelectItem value="xl">Muito Grande</SelectItem>
                    <SelectItem value="2xl">Extra Grande</SelectItem>
                    <SelectItem value="3xl">Título</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Peso</Label>
                <Select 
                  value={widget.config.fontWeight || 'semibold'}
                  onValueChange={(value) => onUpdateConfig({ fontWeight: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="semibold">Semi-negrito</SelectItem>
                    <SelectItem value="bold">Negrito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <Select 
                value={widget.config.textAlign || 'left'}
                onValueChange={(value) => onUpdateConfig({ textAlign: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Espaçamento Vertical</Label>
              <Select 
                value={widget.config.verticalPadding || 'sm'}
                onValueChange={(value) => onUpdateConfig({ verticalPadding: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="xs">Mínimo</SelectItem>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Controla o espaço interno vertical do texto</p>
            </div>
          </>
        )}

        {/* Image Block */}
        {widget.type === 'image-block' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="image-url">URL da Imagem</Label>
              <Input
                id="image-url"
                value={widget.config.imageUrl || ''}
                onChange={(e) => onUpdateConfig({ imageUrl: e.target.value })}
                placeholder="https://exemplo.com/imagem.png"
              />
              <p className="text-xs text-muted-foreground">Cole a URL de uma imagem (PNG, JPG, etc)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-alt">Texto Alternativo</Label>
              <Input
                id="image-alt"
                value={widget.config.imageAlt || ''}
                onChange={(e) => onUpdateConfig({ imageAlt: e.target.value })}
                placeholder="Descrição da imagem"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ajuste</Label>
                <Select 
                  value={widget.config.objectFit || 'contain'}
                  onValueChange={(value) => onUpdateConfig({ objectFit: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contain">Conter</SelectItem>
                    <SelectItem value="cover">Cobrir</SelectItem>
                    <SelectItem value="fill">Preencher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cantos</Label>
                <Select 
                  value={widget.config.borderRadius || 'md'}
                  onValueChange={(value) => onUpdateConfig({ borderRadius: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem arredondamento</SelectItem>
                    <SelectItem value="sm">Pequeno</SelectItem>
                    <SelectItem value="md">Médio</SelectItem>
                    <SelectItem value="lg">Grande</SelectItem>
                    <SelectItem value="xl">Extra Grande</SelectItem>
                    <SelectItem value="full">Circular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Divider */}
        {widget.type === 'divider' && (
          <>
            <div className="space-y-2">
              <Label>Estilo</Label>
              <Select 
                value={widget.config.dividerStyle || 'solid'}
                onValueChange={(value) => onUpdateConfig({ dividerStyle: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólido</SelectItem>
                  <SelectItem value="dashed">Tracejado</SelectItem>
                  <SelectItem value="dotted">Pontilhado</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="divider-thickness">Espessura (px)</Label>
              <Input
                id="divider-thickness"
                type="number"
                min={1}
                max={10}
                value={widget.config.dividerThickness || 1}
                onChange={(e) => onUpdateConfig({ dividerThickness: parseInt(e.target.value) || 1 })}
              />
            </div>
          </>
        )}

        {/* Box */}
        {widget.type === 'box' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="box-text">Texto (opcional)</Label>
              <Textarea
                id="box-text"
                value={widget.config.text || ''}
                onChange={(e) => onUpdateConfig({ text: e.target.value })}
                placeholder="Conteúdo da caixa"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cantos</Label>
                <Select 
                  value={widget.config.borderRadius || 'lg'}
                  onValueChange={(value) => onUpdateConfig({ borderRadius: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem arredondamento</SelectItem>
                    <SelectItem value="sm">Pequeno</SelectItem>
                    <SelectItem value="md">Médio</SelectItem>
                    <SelectItem value="lg">Grande</SelectItem>
                    <SelectItem value="xl">Extra Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Padding</Label>
                <Select 
                  value={widget.config.padding || 'md'}
                  onValueChange={(value) => onUpdateConfig({ padding: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="sm">Pequeno</SelectItem>
                    <SelectItem value="md">Médio</SelectItem>
                    <SelectItem value="lg">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento do Texto</Label>
              <Select 
                value={widget.config.textAlign || 'left'}
                onValueChange={(value) => onUpdateConfig({ textAlign: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Spacer - apenas info */}
        {widget.type === 'spacer' && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              O espaçador é invisível no relatório final. Use-o para criar espaços entre widgets. 
              Ajuste a altura redimensionando o widget no canvas.
            </p>
          </div>
        )}

        {/* === WIDGETS DE DADOS === */}

        {/* Título (para widgets não-conteúdo) */}
        {!isContentWidget && (
          <>
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
          </>
        )}

        {/* === CONFIGURAÇÕES ESPECÍFICAS POR TIPO === */}

        {/* Card de Métrica - Seleção ÚNICA */}
        {widget.type === 'metric-card' && (
          <div className="space-y-3">
            <Label>Métrica</Label>
            <Select 
              value={widget.config.metrics?.[0] || 'impressions'}
              onValueChange={(value) => onUpdateConfig({ metrics: [value as MetricKey] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_METRICS.map(metric => (
                  <SelectItem key={metric} value={metric}>
                    {METRIC_LABELS[metric]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Gráfico de Pizza - Dimensão e Métrica */}
        {widget.type === 'pie-chart' && (
          <>
            <div className="space-y-3">
              <Label>Dimensão (agrupamento)</Label>
              <Select 
                value={widget.config.dimension || 'gender'}
                onValueChange={(value) => onUpdateConfig({ dimension: value as DimensionKey })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIE_DIMENSIONS.map(dim => (
                    <SelectItem key={dim} value={dim}>
                      {DIMENSION_LABELS[dim]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Métrica (valor)</Label>
              <Select 
                value={widget.config.metrics?.[0] || 'impressions'}
                onValueChange={(value) => onUpdateConfig({ metrics: [value as MetricKey] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIE_METRICS.map(metric => (
                    <SelectItem key={metric} value={metric}>
                      {METRIC_LABELS[metric]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Tabela Simples - Dimensão e Métricas */}
        {widget.type === 'simple-table' && (
          <>
            <div className="space-y-3">
              <Label>Dimensão (linhas)</Label>
              <Select 
                value={widget.config.dimension || 'campaigns'}
                onValueChange={(value) => onUpdateConfig({ dimension: value as DimensionKey })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABLE_DIMENSIONS.map(dim => (
                    <SelectItem key={dim} value={dim}>
                      {DIMENSION_LABELS[dim]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Métricas (colunas)</Label>
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
          </>
        )}

        {/* Gráficos de Linha/Barra/Área - Seleção múltipla de métricas */}
        {['line-chart', 'bar-chart', 'area-chart'].includes(widget.type) && (
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

        {/* Top Criativos - Seleção de métricas */}
        {widget.type === 'top-creatives' && (
          <div className="space-y-3">
            <Label>Métricas exibidas</Label>
            <div className="grid grid-cols-2 gap-2">
              {CREATIVE_METRICS.map(metric => (
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

        {/* Ações do Widget */}
        <Separator />
        <div className="space-y-2">
          <Label>Ações</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDuplicate}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={onRemove}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
