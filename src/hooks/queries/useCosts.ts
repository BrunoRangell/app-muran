
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Cost, CostFilters } from "@/types/cost";
import { toast } from "@/components/ui/use-toast";

export const useCosts = (filters?: CostFilters) => {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Sucesso",
        description: "Custo cadastrado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o custo",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Sucesso",
        description: "Custo atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar custo:", error);
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
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Sucesso",
        description: "Custo excluído com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao excluir custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o custo",
        variant: "destructive",
      });
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
