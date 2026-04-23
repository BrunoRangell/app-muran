// Painel de propriedades dinâmico baseado em propertyFields do registry
import { PremiumBlock } from '@/types/premium-v2';
import { PremiumBlockDefinition, PropertyField } from './registry';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ALL_METRICS, METRIC_LABELS } from '@/types/template-editor';

interface Props {
  block: PremiumBlock;
  definition: PremiumBlockDefinition;
  onChange: (patch: Partial<PremiumBlock['config']>) => void;
  onLayoutChange: (patch: Partial<PremiumBlock['layout']>) => void;
}

export function PremiumPropertiesPanel({ block, definition, onChange, onLayoutChange }: Props) {
  const c = block.config;

  const renderField = (f: PropertyField, idx: number) => {
    switch (f.kind) {
      case 'title':
        return (
          <Field key={idx} label="Título">
            <Input value={c.title || ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="Título do bloco" />
          </Field>
        );
      case 'eyebrow':
        return (
          <Field key={idx} label="Eyebrow">
            <Input value={c.eyebrow || ''} onChange={(e) => onChange({ eyebrow: e.target.value })} placeholder="Pequeno rótulo acima" />
          </Field>
        );
      case 'subtitle':
        return (
          <Field key={idx} label="Subtítulo">
            <Input value={c.subtitle || ''} onChange={(e) => onChange({ subtitle: e.target.value })} />
          </Field>
        );
      case 'text':
        return (
          <Field key={idx} label="Texto">
            <Textarea value={c.text || ''} onChange={(e) => onChange({ text: e.target.value })} rows={4} />
          </Field>
        );
      case 'metric':
        return (
          <Field key={idx} label="Métrica">
            <Select value={c.metric} onValueChange={(v) => onChange({ metric: v as any })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {ALL_METRICS.map((m) => (<SelectItem key={m} value={m}>{METRIC_LABELS[m]}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
        );
      case 'metrics-multi':
        return (
          <Field key={idx} label={`Métricas laterais (até ${f.max || 3})`}>
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border rounded-md p-2">
              {ALL_METRICS.map((m) => {
                const checked = c.metrics?.includes(m) || false;
                return (
                  <label key={m} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const curr = c.metrics || [];
                        const next = e.target.checked
                          ? [...curr, m].slice(0, f.max || 3)
                          : curr.filter((x) => x !== m);
                        onChange({ metrics: next });
                      }}
                    />
                    {METRIC_LABELS[m]}
                  </label>
                );
              })}
            </div>
          </Field>
        );
      case 'platform':
        return (
          <Field key={idx} label="Plataforma">
            <Select value={c.platform} onValueChange={(v) => onChange({ platform: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        );
      case 'rankingSource':
        return (
          <Field key={idx} label="Fonte do ranking">
            <Select value={c.rankingSource} onValueChange={(v) => onChange({ rankingSource: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regions">Regiões</SelectItem>
                <SelectItem value="campaigns">Campanhas</SelectItem>
                <SelectItem value="creatives">Criativos</SelectItem>
                <SelectItem value="age">Faixa Etária</SelectItem>
                <SelectItem value="gender">Gênero</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        );
      case 'chartSource':
        return (
          <Field key={idx} label="Fonte dos dados">
            <Select value={c.chartSource} onValueChange={(v) => onChange({ chartSource: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="combined">Combinado</SelectItem>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        );
      case 'donutSource':
        return (
          <Field key={idx} label="Distribuição">
            <Select value={c.donutSource} onValueChange={(v) => onChange({ donutSource: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="platform">Por Plataforma</SelectItem>
                <SelectItem value="gender">Por Gênero</SelectItem>
                <SelectItem value="age">Por Idade</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        );
      case 'limit':
        return (
          <Field key={idx} label="Limite de itens">
            <Input
              type="number" min={f.min || 1} max={f.max || 50}
              value={c.limit || 8}
              onChange={(e) => onChange({ limit: parseInt(e.target.value) || 8 })}
            />
          </Field>
        );
      case 'accent':
        return (
          <Field key={idx} label="Cor de destaque">
            <div className="flex gap-2">
              <Input
                type="color"
                value={c.accent || '#ff6e00'}
                onChange={(e) => onChange({ accent: e.target.value })}
                className="w-16 h-9 p-1"
              />
              <Input
                value={c.accent || '#ff6e00'}
                onChange={(e) => onChange({ accent: e.target.value })}
                className="flex-1"
              />
            </div>
          </Field>
        );
      case 'variant':
        return (
          <Field key={idx} label="Variante visual">
            <Select value={c.variant || 'default'} onValueChange={(v) => onChange({ variant: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão</SelectItem>
                <SelectItem value="subtle">Sutil</SelectItem>
                <SelectItem value="bold">Forte</SelectItem>
                <SelectItem value="glow">Glow</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        );
      case 'showComparison':
        return (
          <ToggleField key={idx} label="Mostrar comparativo" checked={c.showComparison !== false} onChange={(v) => onChange({ showComparison: v })} />
        );
      case 'showLegend':
        return (
          <ToggleField key={idx} label="Mostrar legenda" checked={c.showLegend !== false} onChange={(v) => onChange({ showLegend: v })} />
        );
      case 'showTrend':
        return (
          <ToggleField key={idx} label="Mostrar tendência" checked={c.showTrend !== false} onChange={(v) => onChange({ showTrend: v })} />
        );
      case 'align':
        return (
          <Field key={idx} label="Alinhamento">
            <Select value={c.align || 'left'} onValueChange={(v) => onChange({ align: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{definition.name}</h3>
        <p className="text-xs text-muted-foreground">{definition.description}</p>
      </div>

      <div className="space-y-3">
        {definition.propertyFields.map(renderField)}
      </div>

      <div className="space-y-3 pt-3 border-t">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Layout</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Largura (col)">
            <Input
              type="number" min={1} max={12} value={block.layout.w}
              onChange={(e) => onLayoutChange({ w: Math.max(1, Math.min(12, parseInt(e.target.value) || 1)) })}
            />
          </Field>
          <Field label="Altura">
            <Input
              type="number" min={1} max={12} value={block.layout.h}
              onChange={(e) => onLayoutChange({ h: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </Field>
          <Field label="X (col)">
            <Input
              type="number" min={0} max={11} value={block.layout.x}
              onChange={(e) => onLayoutChange({ x: Math.max(0, Math.min(11, parseInt(e.target.value) || 0)) })}
            />
          </Field>
          <Field label="Y (linha)">
            <Input
              type="number" min={0} value={block.layout.y}
              onChange={(e) => onLayoutChange({ y: Math.max(0, parseInt(e.target.value) || 0) })}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
