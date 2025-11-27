import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportTemplate {
  id: string;
  name: string;
  client_id: string | null;
  is_global: boolean;
  sections: {
    overview?: { enabled: boolean; order: number };
    demographics?: { enabled: boolean; order: number };
    topCreatives?: { enabled: boolean; order: number; limit?: number };
    conversionFunnel?: { enabled: boolean; order: number };
    campaignTable?: { enabled: boolean; order: number };
    trendCharts?: { enabled: boolean; order: number };
  };
  created_at: string;
  updated_at: string;
}

export const useReportTemplates = (clientId?: string) => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['report-templates', clientId],
    queryFn: async () => {
      let query = supabase.from('report_templates').select('*');
      
      if (clientId) {
        query = query.or(`is_global.eq.true,client_id.eq.${clientId}`);
      } else {
        query = query.eq('is_global', true);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data as ReportTemplate[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('report_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<ReportTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    }
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate
  };
};
