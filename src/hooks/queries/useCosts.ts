
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Cost, CostFilters } from "@/types/cost";
import { showDataOperationToast } from "@/utils/toastUtils";
import { useCacheManager } from "@/utils/cacheUtils";
import { QUERY_KEYS } from "@/utils/queryUtils";
import { handleError } from "@/utils/errorUtils";

export const useCosts = (filters?: CostFilters) => {
  const queryClient = useQueryClient();
  const cacheManager = useCacheManager(queryClient);

  const costsQuery = useQuery({
    queryKey: QUERY_KEYS.costs.byFilters(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from("costs")
        .select(`
          *,
          costs_categories (
            category_id
          )
        `);

      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      if (filters?.categories?.length) {
        query = query.in("category_id", filters.categories);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Cost[];
    },
  });

  const createCost = useMutation({
    mutationFn: async (newCost: Partial<Cost>) => {
      const { data, error } = await supabase
        .from("costs")
        .insert(newCost)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      cacheManager.invalidateCosts();
      showDataOperationToast('costs', 'created');
    },
    onError: (error) => {
      handleError(error, "criar custo");
      showDataOperationToast('costs', 'createError');
    },
  });

  const updateCost = useMutation({
    mutationFn: async (updatedCost: Partial<Cost>) => {
      const { data, error } = await supabase
        .from("costs")
        .update(updatedCost)
        .eq("id", updatedCost.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      cacheManager.invalidateCosts();
      showDataOperationToast('costs', 'updated');
    },
    onError: (error) => {
      handleError(error, "atualizar custo");
      showDataOperationToast('costs', 'updateError');
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("costs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      cacheManager.invalidateCosts();
      showDataOperationToast('costs', 'deleted');
    },
    onError: (error) => {
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
