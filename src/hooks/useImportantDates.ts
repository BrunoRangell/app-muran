import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImportantDate, ImportantDateFormData } from "@/types/importantDate";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export const useImportantDates = (entityType?: string, entityId?: string) => {
  const queryClient = useQueryClient();

  // Buscar todas as datas
  const { data: dates, isLoading } = useQuery({
    queryKey: ['important-dates', entityType, entityId],
    queryFn: async () => {
      logger.debug("🔍 [IMPORTANT_DATES] Fetching dates...", { entityType, entityId });
      
      let query = supabase
        .from('important_dates')
        .select('*')
        .order('date', { ascending: true });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;
      if (error) {
        logger.error("❌ [IMPORTANT_DATES] Error fetching dates:", error);
        throw error;
      }
      
      logger.info(`✅ [IMPORTANT_DATES] Loaded ${data?.length || 0} dates`);
      return data as ImportantDate[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Criar nova data
  const createDate = useMutation({
    mutationFn: async (formData: ImportantDateFormData) => {
      logger.debug("📝 [IMPORTANT_DATES] Creating date:", formData);
      
      const { data, error } = await supabase
        .from('important_dates')
        .insert(formData)
        .select()
        .single();
      
      if (error) {
        logger.error("❌ [IMPORTANT_DATES] Error creating date:", error);
        throw error;
      }
      
      logger.info("✅ [IMPORTANT_DATES] Date created successfully");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['important-dates'] });
      toast.success('Data adicionada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar data');
    }
  });

  // Atualizar data
  const updateDate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImportantDate> & { id: string }) => {
      logger.debug("📝 [IMPORTANT_DATES] Updating date:", { id, updates });
      
      const { data, error } = await supabase
        .from('important_dates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        logger.error("❌ [IMPORTANT_DATES] Error updating date:", error);
        throw error;
      }
      
      logger.info("✅ [IMPORTANT_DATES] Date updated successfully");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['important-dates'] });
      toast.success('Data atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar data');
    }
  });

  // Deletar data
  const deleteDate = useMutation({
    mutationFn: async (id: string) => {
      logger.debug("🗑️ [IMPORTANT_DATES] Deleting date:", id);
      
      const { error } = await supabase
        .from('important_dates')
        .delete()
        .eq('id', id);
      
      if (error) {
        logger.error("❌ [IMPORTANT_DATES] Error deleting date:", error);
        throw error;
      }
      
      logger.info("✅ [IMPORTANT_DATES] Date deleted successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['important-dates'] });
      toast.success('Data removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover data');
    }
  });

  return {
    dates: dates || [],
    isLoading,
    createDate,
    updateDate,
    deleteDate
  };
};
