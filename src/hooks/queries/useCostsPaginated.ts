import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cost, CostFilters } from "@/types/cost";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

const PAGE_SIZE = 50;

export const useCostsPaginated = (filters?: CostFilters) => {
  const queryClient = useQueryClient();

  const costsQuery = useInfiniteQuery({
    queryKey: ["costs-paginated", filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("costs")
        .select(`
          *,
          costs_categories (
            category_id
          )
        `, { count: "exact" });

      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order("date", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error) {
        logger.error("Erro ao buscar custos:", error);
        throw error;
      }

      return {
        costs: data as Cost[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const createCost = useMutation({
    mutationFn: async (newCost: Omit<Cost, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("costs")
        .insert(newCost)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Sucesso",
        description: "Custo cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      logger.error("Erro ao criar custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o custo",
        variant: "destructive",
      });
    },
  });

  const updateCost = useMutation({
    mutationFn: async (updatedCost: Partial<Cost> & { id: number }) => {
      const { id, ...updateData } = updatedCost;
      const { data, error } = await supabase
        .from("costs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Sucesso",
        description: "Custo atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      logger.error("Erro ao atualizar custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o custo",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["costs-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Sucesso",
        description: "Custo excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      logger.error("Erro ao excluir custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o custo",
        variant: "destructive",
      });
    },
  });

  return {
    costs: costsQuery.data?.pages.flatMap((page) => page.costs) || [],
    totalCount: costsQuery.data?.pages[0]?.totalCount || 0,
    isLoading: costsQuery.isLoading,
    isFetchingNextPage: costsQuery.isFetchingNextPage,
    hasNextPage: costsQuery.hasNextPage,
    fetchNextPage: costsQuery.fetchNextPage,
    error: costsQuery.error,
    createCost,
    updateCost,
    deleteCost,
  };
};
