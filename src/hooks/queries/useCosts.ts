
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Cost, CostFilters } from "@/types/cost";
import { showCostSuccessToast, showCostErrorToast } from "@/utils/toastUtils";
import { useCacheManager } from "@/utils/cacheUtils";

export const useCosts = (filters?: CostFilters) => {
  const queryClient = useQueryClient();
  const cacheManager = useCacheManager(queryClient);

  const costsQuery = useQuery({
    queryKey: ["costs", filters],
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
      showCostSuccessToast('created');
    },
    onError: (error) => {
      console.error("Erro ao criar custo:", error);
      showCostErrorToast('createError');
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
      showCostSuccessToast('updated');
    },
    onError: (error) => {
      console.error("Erro ao atualizar custo:", error);
      showCostErrorToast('updateError');
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
      showCostSuccessToast('deleted');
    },
    onError: (error) => {
      console.error("Erro ao excluir custo:", error);
      showCostErrorToast('deleteError');
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
