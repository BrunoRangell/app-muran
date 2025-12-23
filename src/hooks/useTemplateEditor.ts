import { useState, useCallback } from 'react';
import { Layout } from 'react-grid-layout';
import { 
  TemplateWidget, 
  TemplateData, 
  WidgetType,
  PresetType,
  DEFAULT_TEMPLATE_DATA,
  createWidget,
  expandPresetToWidgets,
  isPresetType,
  WIDGET_CATALOG
} from '@/types/template-editor';
import { expandPresetWidgets } from './useWidgetPresets';

interface UseTemplateEditorReturn {
  // Estado
  widgets: TemplateWidget[];
  selectedWidgetId: string | null;
  templateName: string;
  isGlobal: boolean;
  isDirty: boolean;
  
  // Ações
  setTemplateName: (name: string) => void;
  setIsGlobal: (isGlobal: boolean) => void;
  selectWidget: (id: string | null) => void;
  addWidget: (type: WidgetType | PresetType | string, presetWidgetsOrPosition?: { x: number; y: number } | TemplateWidget[]) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Partial<TemplateWidget['config']>) => void;
  updateLayout: (layout: Layout[]) => void;
  duplicateWidget: (id: string) => void;
  
  // Utilitários
  getSelectedWidget: () => TemplateWidget | null;
  getLayoutForGrid: (selectedId?: string | null) => Layout[];
  loadTemplate: (data: TemplateData, name: string, isGlobal: boolean) => void;
  getTemplateData: () => TemplateData;
  resetEditor: () => void;
}

export function useTemplateEditor(): UseTemplateEditorReturn {
  const [widgets, setWidgets] = useState<TemplateWidget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Novo Template');
  const [isGlobal, setIsGlobal] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Selecionar widget
  const selectWidget = useCallback((id: string | null) => {
    setSelectedWidgetId(id);
  }, []);

  // Adicionar widget (ou expandir preset)
  const addWidget = useCallback((
    type: WidgetType | PresetType | string, 
    presetWidgetsOrPosition?: { x: number; y: number } | TemplateWidget[]
  ) => {
    // Calcular próxima posição Y
    const nextY = Math.max(0, ...widgets.map(w => w.layout.y + w.layout.h));
    
    // Check if it's a dynamic preset from database (format: "preset:uuid")
    if (typeof type === 'string' && type.startsWith('preset:') && Array.isArray(presetWidgetsOrPosition)) {
      const presetWidgets = presetWidgetsOrPosition as TemplateWidget[];
      const newWidgets = expandPresetWidgets(presetWidgets, nextY);
      setWidgets(prev => [...prev, ...newWidgets]);
      if (newWidgets.length > 0) {
        setSelectedWidgetId(newWidgets[0].id);
      }
      setIsDirty(true);
      return;
    }
    
    // Handle position parameter
    const position = !Array.isArray(presetWidgetsOrPosition) ? presetWidgetsOrPosition : undefined;
    
    // Verificar se é um preset hardcoded que deve ser expandido
    if (isPresetType(type as string)) {
      const newWidgets = expandPresetToWidgets(type as PresetType, position?.y ?? nextY);
      setWidgets(prev => [...prev, ...newWidgets]);
      if (newWidgets.length > 0) {
        setSelectedWidgetId(newWidgets[0].id);
      }
    } else {
      // Widget individual normal
      const pos = position ?? { x: 0, y: nextY };
      const newWidget = createWidget(type as WidgetType, pos);
      setWidgets(prev => [...prev, newWidget]);
      setSelectedWidgetId(newWidget.id);
    }
    
    setIsDirty(true);
  }, [widgets]);

  // Remover widget
  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
    }
    setIsDirty(true);
  }, [selectedWidgetId]);

  // Atualizar configuração do widget
  const updateWidgetConfig = useCallback((id: string, config: Partial<TemplateWidget['config']>) => {
    setWidgets(prev => prev.map(w => 
      w.id === id 
        ? { ...w, config: { ...w.config, ...config } }
        : w
    ));
    setIsDirty(true);
  }, []);

  // Atualizar layout (após drag/resize)
  const updateLayout = useCallback((layout: Layout[]) => {
    setWidgets(prev => prev.map(widget => {
      const layoutItem = layout.find(l => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          layout: {
            ...widget.layout,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return widget;
    }));
    setIsDirty(true);
  }, []);

  // Duplicar widget
  const duplicateWidget = useCallback((id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    const newWidget: TemplateWidget = {
      ...widget,
      id: crypto.randomUUID(),
      layout: {
        ...widget.layout,
        y: widget.layout.y + widget.layout.h // Colocar abaixo do original
      },
      config: {
        ...widget.config,
        title: widget.config.title ? `${widget.config.title} (cópia)` : undefined
      }
    };

    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidgetId(newWidget.id);
    setIsDirty(true);
  }, [widgets]);

  // Obter widget selecionado
  const getSelectedWidget = useCallback(() => {
    return widgets.find(w => w.id === selectedWidgetId) ?? null;
  }, [widgets, selectedWidgetId]);

  // Converter para formato do react-grid-layout
  // isDraggable/isResizable por item: só o widget selecionado pode ser movido/redimensionado
  const getLayoutForGrid = useCallback((selectedId: string | null = null): Layout[] => {
    return widgets.map(widget => {
      const metadata = WIDGET_CATALOG.find(m => m.type === widget.type);
      const isThisSelected = widget.id === selectedId;
      return {
        i: widget.id,
        x: widget.layout.x,
        y: widget.layout.y,
        w: widget.layout.w,
        h: widget.layout.h,
        minW: widget.layout.minW ?? metadata?.defaultLayout.minW,
        minH: widget.layout.minH ?? metadata?.defaultLayout.minH,
        maxW: widget.layout.maxW ?? metadata?.defaultLayout.maxW,
        maxH: widget.layout.maxH ?? metadata?.defaultLayout.maxH,
        isDraggable: isThisSelected,
        isResizable: isThisSelected,
      };
    });
  }, [widgets]);

  // Carregar template existente
  const loadTemplate = useCallback((data: TemplateData, name: string, global: boolean) => {
    setWidgets(data.widgets);
    setTemplateName(name);
    setIsGlobal(global);
    setSelectedWidgetId(null);
    setIsDirty(false);
  }, []);

  // Obter dados do template para salvar
  const getTemplateData = useCallback((): TemplateData => {
    return {
      widgets,
      gridConfig: DEFAULT_TEMPLATE_DATA.gridConfig,
      version: 1
    };
  }, [widgets]);

  // Resetar editor
  const resetEditor = useCallback(() => {
    setWidgets([]);
    setSelectedWidgetId(null);
    setTemplateName('Novo Template');
    setIsGlobal(true);
    setIsDirty(false);
  }, []);

  return {
    // Estado
    widgets,
    selectedWidgetId,
    templateName,
    isGlobal,
    isDirty,
    
    // Ações
    setTemplateName,
    setIsGlobal,
    selectWidget,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    updateLayout,
    duplicateWidget,
    
    // Utilitários
    getSelectedWidget,
    getLayoutForGrid,
    loadTemplate,
    getTemplateData,
    resetEditor
  };
}
