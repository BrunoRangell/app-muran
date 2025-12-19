import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { WidgetPalette } from './WidgetPalette';
import { WidgetProperties } from './WidgetProperties';
import { TemplateEditorCanvas } from './TemplateEditorCanvas';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { useTemplateEditor } from '@/hooks/useTemplateEditor';
import { useReportTemplates } from '@/hooks/useReportTemplates';
import { TemplateData } from '@/types/template-editor';
import { cn } from '@/lib/utils';

export function TemplateEditor() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const navigate = useNavigate();
  const { templateId } = useParams();
  const isEditing = !!templateId;
  
  const { templates, createTemplate, updateTemplate, isLoading } = useReportTemplates();
  
  const {
    widgets,
    selectedWidgetId,
    templateName,
    isGlobal,
    isDirty,
    setTemplateName,
    setIsGlobal,
    selectWidget,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    updateLayout,
    duplicateWidget,
    getSelectedWidget,
    getLayoutForGrid,
    loadTemplate,
    getTemplateData,
    resetEditor
  } = useTemplateEditor();

  // Carregar template existente
  useEffect(() => {
    if (isEditing && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // Verificar se já está no novo formato de widgets
        const sections = template.sections as any;
        if (sections?.widgets) {
          loadTemplate(sections as TemplateData, template.name, template.is_global);
        } else {
          // Template antigo - carregar com widgets padrão baseados nas seções
          const legacyWidgets = convertLegacySections(sections);
          loadTemplate(
            { widgets: legacyWidgets, gridConfig: { cols: 12, rowHeight: 80 }, version: 1 },
            template.name,
            template.is_global
          );
        }
      }
    }
  }, [isEditing, templateId, templates, loadTemplate]);

  // Converter seções antigas para widgets
  const convertLegacySections = (sections: any) => {
    const widgets: any[] = [];
    let y = 0;
    
    if (sections?.overview?.enabled !== false) {
      widgets.push({
        id: crypto.randomUUID(),
        type: 'overview-full',
        layout: { x: 0, y, w: 12, h: 2 },
        config: { showTitle: true, title: 'Visão Geral' }
      });
      y += 2;
    }
    
    if (sections?.trendCharts?.enabled !== false) {
      widgets.push({
        id: crypto.randomUUID(),
        type: 'trends-full',
        layout: { x: 0, y, w: 12, h: 4 },
        config: { showTitle: true, title: 'Tendências' }
      });
      y += 4;
    }
    
    if (sections?.demographics?.enabled !== false) {
      widgets.push({
        id: crypto.randomUUID(),
        type: 'demographics-full',
        layout: { x: 0, y, w: 12, h: 3 },
        config: { showTitle: true, title: 'Demografia' }
      });
      y += 3;
    }
    
    if (sections?.topCreatives?.enabled !== false) {
      widgets.push({
        id: crypto.randomUUID(),
        type: 'top-creatives',
        layout: { x: 0, y, w: 12, h: 3 },
        config: { showTitle: true, title: 'Top Criativos', limit: sections?.topCreatives?.limit || 5 }
      });
      y += 3;
    }
    
    if (sections?.campaignTable?.enabled !== false) {
      widgets.push({
        id: crypto.randomUUID(),
        type: 'campaigns-table',
        layout: { x: 0, y, w: 12, h: 3 },
        config: { showTitle: true, title: 'Campanhas' }
      });
    }
    
    return widgets;
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }

    try {
      const templateData = getTemplateData();
      
      if (isEditing && templateId) {
        updateTemplate({
          id: templateId,
          name: templateName,
          is_global: isGlobal,
          sections: templateData as any
        });
        toast.success('Template atualizado com sucesso!');
      } else {
        createTemplate({
          name: templateName,
          is_global: isGlobal,
          client_id: null,
          sections: templateData as any
        });
        toast.success('Template criado com sucesso!');
      }
      
      navigate('/relatorios-trafego/templates');
    } catch (error) {
      toast.error('Erro ao salvar template');
      console.error(error);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (confirm('Existem alterações não salvas. Deseja sair mesmo assim?')) {
        navigate('/relatorios-trafego/templates');
      }
    } else {
      navigate('/relatorios-trafego/templates');
    }
  };

  const selectedWidget = getSelectedWidget();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-64 font-medium"
                placeholder="Nome do template"
              />
              <div className="flex items-center gap-2 text-sm">
                <Switch
                  id="is-global"
                  checked={isGlobal}
                  onCheckedChange={setIsGlobal}
                />
                <Label htmlFor="is-global" className="text-muted-foreground cursor-pointer">
                  Template global
                </Label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetEditor}
              disabled={widgets.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={widgets.length === 0}
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={widgets.length === 0 || !templateName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Paleta de widgets (esquerda) */}
        <aside className="w-72 flex-shrink-0 border-r border-border bg-card overflow-hidden">
          <WidgetPalette onAddWidget={addWidget} />
        </aside>

        {/* Canvas (centro) */}
        <main className="flex-1 p-4 overflow-hidden">
          <TemplateEditorCanvas
            widgets={widgets}
            layout={getLayoutForGrid()}
            selectedWidgetId={selectedWidgetId}
            onLayoutChange={updateLayout}
            onSelectWidget={selectWidget}
            onRemoveWidget={removeWidget}
            onDuplicateWidget={duplicateWidget}
          />
        </main>

        {/* Propriedades (direita) */}
        <aside className={cn(
          "w-80 flex-shrink-0 border-l border-border bg-card overflow-hidden",
          "transition-all duration-300",
          selectedWidget ? "translate-x-0" : "translate-x-full w-0 border-l-0"
        )}>
          <WidgetProperties
            widget={selectedWidget}
            onUpdateConfig={(config) => {
              if (selectedWidgetId) {
                updateWidgetConfig(selectedWidgetId, config);
              }
            }}
            onClose={() => selectWidget(null)}
            onRemove={() => {
              if (selectedWidgetId) {
                removeWidget(selectedWidgetId);
              }
            }}
            onDuplicate={() => {
              if (selectedWidgetId) {
                duplicateWidget(selectedWidgetId);
              }
            }}
          />
        </aside>
      </div>

      {/* Modal de Preview */}
      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        widgets={widgets}
        templateName={templateName}
      />
    </div>
  );
}
