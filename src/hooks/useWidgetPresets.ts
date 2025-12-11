import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TemplateWidget } from '@/types/template-editor';

export interface WidgetPreset {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  widgets: TemplateWidget[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePresetInput {
  name: string;
  description?: string;
  icon?: string;
  widgets: TemplateWidget[];
}

interface UpdatePresetInput {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  widgets?: TemplateWidget[];
}

export function useWidgetPresets() {
  const queryClient = useQueryClient();

  const { data: presets, isLoading, error } = useQuery({
    queryKey: ['widget-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('widget_presets')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');
      
      if (error) throw error;
      
      // Parse widgets JSON with proper typing
      return (data || []).map(preset => ({
        ...preset,
        widgets: (Array.isArray(preset.widgets) ? preset.widgets : []) as unknown as TemplateWidget[]
      })) as WidgetPreset[];
    }
  });

  const createPreset = useMutation({
    mutationFn: async (input: CreatePresetInput) => {
      const { data, error } = await supabase
        .from('widget_presets')
        .insert({
          name: input.name,
          description: input.description || null,
          icon: input.icon || 'LayoutGrid',
          widgets: input.widgets as any,
          is_system: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-presets'] });
      toast({
        title: 'Bloco criado',
        description: 'O bloco rápido foi criado com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar bloco',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updatePreset = useMutation({
    mutationFn: async (input: UpdatePresetInput) => {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.widgets !== undefined) updateData.widgets = input.widgets;

      const { data, error } = await supabase
        .from('widget_presets')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-presets'] });
      toast({
        title: 'Bloco atualizado',
        description: 'O bloco rápido foi atualizado com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar bloco',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('widget_presets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-presets'] });
      toast({
        title: 'Bloco excluído',
        description: 'O bloco rápido foi excluído com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir bloco',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const duplicatePreset = useMutation({
    mutationFn: async (preset: WidgetPreset) => {
      const { data, error } = await supabase
        .from('widget_presets')
        .insert({
          name: `${preset.name} (cópia)`,
          description: preset.description,
          icon: preset.icon,
          widgets: preset.widgets as any,
          is_system: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-presets'] });
      toast({
        title: 'Bloco duplicado',
        description: 'O bloco rápido foi duplicado com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao duplicar bloco',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    presets: presets || [],
    isLoading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset
  };
}

// Helper to expand preset widgets with new IDs and Y position
export function expandPresetWidgets(
  presetWidgets: TemplateWidget[],
  startY: number
): TemplateWidget[] {
  return presetWidgets.map(widget => ({
    ...widget,
    id: crypto.randomUUID(),
    layout: {
      ...widget.layout,
      y: startY + (widget.layout.y || 0)
    }
  }));
}
