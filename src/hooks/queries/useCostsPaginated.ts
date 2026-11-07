import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cost, CostFilters } from "@/types/cost";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { fetchAllRows } from "@/lib/fetchAllRows";


export const useCostsPaginated = (filters?: CostFilters) => {
  const queryClient = useQueryClient();

  const costsQuery = useInfiniteQuery({
    queryKey: ["costs-paginated", filters],
    // Busca TODOS os custos do filtro (em lotes de 1000): os cards, gráficos e totais
    // precisam do conjunto inteiro, não só dos 50 primeiros. A tabela pagina na tela.
    queryFn: async () => {
      const costs = await fetchAllRows<Cost>((from, to) => {
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

        if (filters?.search) {
          query = query.ilike("name", `%${filters.search}%`);
        }

        return query
          .order("date", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to) as unknown as PromiseLike<{ data: Cost[] | null; error: unknown }>;
      }).catch((error) => {
        logger.error("Erro ao buscar custos:", error);
        throw error;
      });

      return {
        costs,
        nextPage: undefined as number | undefined,
        totalCount: costs.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const createCost = useMutation({
    mutationFn: async (newCost: Omit<Cost, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("costs")
        .insert(newCost as any)
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
        .update(updateData as any)
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
