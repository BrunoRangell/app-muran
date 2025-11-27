import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportTemplate, useReportTemplates } from "@/hooks/useReportTemplates";
import { toast } from "sonner";
import { Save, Copy } from "lucide-react";

interface TemplateCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
  clientId?: string;
}

const SECTION_LABELS = {
  overview: 'Visão Geral (Métricas)',
  demographics: 'Dados Demográficos',
  topCreatives: 'Top Criativos',
  conversionFunnel: 'Funil de Conversão',
  campaignTable: 'Tabela de Campanhas',
  trendCharts: 'Gráficos de Tendência'
};

export function TemplateCustomizer({ open, onOpenChange, template, clientId }: TemplateCustomizerProps) {
  const { createTemplate, updateTemplate } = useReportTemplates(clientId);
  const [name, setName] = useState(template?.name || '');
  const [sections, setSections] = useState(template?.sections || {});
  const [saving, setSaving] = useState(false);

  const handleSectionToggle = (sectionKey: string, enabled: boolean) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey as keyof typeof prev],
        enabled
      }
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }

    setSaving(true);
    try {
      if (template && !template.is_global) {
        // Update existing client template
        await updateTemplate({
          id: template.id,
          name,
          sections
        });
        toast.success('Template atualizado com sucesso!');
      } else {
        // Create new client template
        await createTemplate({
          name,
          client_id: clientId || null,
          is_global: false,
          sections
        });
        toast.success('Template criado com sucesso!');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar template');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const sortedSections = Object.entries(sections).sort(
    ([, a], [, b]) => (a?.order || 0) - (b?.order || 0)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template?.is_global ? <Copy className="h-5 w-5" /> : <Save className="h-5 w-5" />}
            {template?.is_global ? 'Salvar como Novo Template' : 'Personalizar Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Nome do Template</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Relatório Mensal Cliente X"
            />
            {template?.is_global && (
              <p className="text-xs text-muted-foreground">
                Templates globais não podem ser editados. Um novo template será criado.
              </p>
            )}
          </div>

          {/* Sections Configuration */}
          <div className="space-y-3">
            <Label>Seções do Relatório</Label>
            <div className="border rounded-lg divide-y">
              {sortedSections.map(([key, config]) => (
                <div key={key} className="p-4 flex items-start gap-3">
                  <Checkbox
                    id={`section-${key}`}
                    checked={config?.enabled || false}
                    onCheckedChange={(checked) => 
                      handleSectionToggle(key, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`section-${key}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {SECTION_LABELS[key as keyof typeof SECTION_LABELS] || key}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ordem: {config?.order || 0}
                      {key === 'topCreatives' && 'limit' in config && config.limit && ` • Limite: ${config.limit} anúncios`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Marque as seções que deseja incluir no relatório
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
