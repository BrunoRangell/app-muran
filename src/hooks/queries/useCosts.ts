
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Cost, CostFilters } from "@/types/cost";
import { showDataOperationToast } from "@/utils/toastUtils";
import { useCacheManager } from "@/utils/cacheUtils";
import { QUERY_KEYS } from "@/utils/queryUtils";
import { handleError } from "@/utils/errorUtils";
import { logger } from "@/utils/logger";

export const useCosts = (filters?: CostFilters) => {
  const queryClient = useQueryClient();
  const cacheManager = useCacheManager(queryClient);

  const costsQuery = useQuery({
    queryKey: QUERY_KEYS.costs.byFilters(filters || {}),
    queryFn: async () => {
      logger.info("COSTS", "Buscando custos", { filters });

      let query = supabase
        .from("costs")
        .select("*");

      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("COSTS", "Erro ao buscar custos", error);
        throw error;
      }

      logger.info("COSTS", `Custos encontrados: ${data?.length || 0}`);
      return data as Cost[];
    },
  });

  const createCost = useMutation({
    mutationFn: async (newCost: { 
      name: string; 
      amount: number; 
      date: string; 
      description?: string; 
    }) => {
      logger.info("COSTS", "Criando custo", newCost);

      const { data, error } = await supabase
        .from("costs")
        .insert(newCost)
        .select()
        .single();

      if (error) {
        logger.error("COSTS", "Erro ao criar custo", error);
        throw error;
      }

      logger.info("COSTS", "Custo criado com sucesso");
      return data;
    },
    onSuccess: () => {
      cacheManager.invalidateCosts();
      showDataOperationToast('costs', 'created');
    },
    onError: (error) => {
      logger.error("COSTS", "Erro na criação", error);
      handleError(error, "criar custo");
      showDataOperationToast('costs', 'createError');
    },
  });

  const updateCost = useMutation({
    mutationFn: async (updatedCost: { 
      id: number; 
      name?: string; 
      amount?: number; 
      date?: string; 
      description?: string; 
    }) => {
      logger.info("COSTS", "Atualizando custo", updatedCost);

      const { id, ...updateData } = updatedCost;
      const { data, error } = await supabase
        .from("costs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("COSTS", "Erro ao atualizar custo", error);
        throw error;
      }

      logger.info("COSTS", "Custo atualizado com sucesso");
      return data;
    },
    onSuccess: () => {
      cacheManager.invalidateCosts();
      showDataOperationToast('costs', 'updated');
    },
    onError: (error) => {
      logger.error("COSTS", "Erro na atualização", error);
      handleError(error, "atualizar custo");
      showDataOperationToast('costs', 'updateError');
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (id: number) => {
      logger.info("COSTS", "Deletando custo", { id });

      const { error } = await supabase
        .from("costs")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("COSTS", "Erro ao deletar custo", error);
        throw error;
      }

      logger.info("COSTS", "Custo deletado com sucesso");
    },
    onSuccess: () => {
      cacheManager.invalidateCosts();
      showDataOperationToast('costs', 'deleted');
    },
    onError: (error) => {
      logger.error("COSTS", "Erro na exclusão", error);
      handleError(error, "excluir custo");
      showDataOperationToast('costs', 'deleteError');
    },
  });

  return {
    costs: costsQuery.data || [],
    isLoading: costsQuery.isLoading,
    error: costsQuery.error,
    createCost,
    updateCost,
    deleteCost,
  };
};
