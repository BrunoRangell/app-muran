
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cost, CostFilters } from "@/types/cost";
import { toast } from "sonner";

export const useCosts = (filters?: CostFilters & { monthFilter?: string }) => {
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

      // Filtro por mês específico
      if (filters?.monthFilter) {
        const [year, month] = filters.monthFilter.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte("date", startDate).lte("date", endDate);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transformar os dados para incluir o array de categorias
      const transformedData = data?.map(cost => ({
        ...cost,
        categories: cost.costs_categories?.map((cc: any) => cc.category_id) || []
      })) || [];

      return transformedData as Cost[];
    },
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
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Custo cadastrado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar custo:", error);
      toast.error("Não foi possível cadastrar o custo");
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
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Custo atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar custo:", error);
      toast.error("Não foi possível atualizar o custo");
    },
  });

  const updateCostCategory = useMutation({
    mutationFn: async ({ costId, categories }: { costId: number; categories: string[] }) => {
      // Primeiro, deletar categorias existentes
      await supabase
        .from("costs_categories")
        .delete()
        .eq("cost_id", costId);

      // Se há categorias para adicionar, inserir as novas
      if (categories.length > 0) {
        const { error } = await supabase
          .from("costs_categories")
          .insert(
            categories.map(categoryId => ({
              cost_id: costId,
              category_id: categoryId
            }))
          );

        if (error) throw error;
      }

      return { costId, categories };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Não foi possível atualizar a categoria");
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
      toast.success("Custo excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir custo:", error);
      toast.error("Não foi possível excluir o custo");
    },
  });

  const deleteCosts = useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase
        .from("costs")
        .delete()
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success(`${ids.length} custo${ids.length > 1 ? 's' : ''} excluído${ids.length > 1 ? 's' : ''} com sucesso!`);
    },
    onError: (error) => {
      console.error("Erro ao excluir custos:", error);
      toast.error("Não foi possível excluir os custos selecionados");
    },
  });

  const updateMultipleCostCategories = useMutation({
    mutationFn: async ({ 
      costIds, 
      categories, 
      operation 
    }: { 
      costIds: number[]; 
      categories: string[]; 
      operation: 'add' | 'remove' | 'replace' 
    }) => {
      if (operation === 'replace') {
        // Para substituir: deletar todas as categorias existentes e inserir as novas
        for (const costId of costIds) {
          await supabase
            .from("costs_categories")
            .delete()
            .eq("cost_id", costId);

          if (categories.length > 0) {
            const { error } = await supabase
              .from("costs_categories")
              .insert(
                categories.map(categoryId => ({
                  cost_id: costId,
                  category_id: categoryId
                }))
              );

            if (error) throw error;
          }
        }
      } else if (operation === 'add') {
        // Para adicionar: inserir apenas as categorias que não existem
        for (const costId of costIds) {
          for (const categoryId of categories) {
            // Verificar se já existe
            const { data: existing } = await supabase
              .from("costs_categories")
              .select("*")
              .eq("cost_id", costId)
              .eq("category_id", categoryId)
              .single();

            if (!existing) {
              const { error } = await supabase
                .from("costs_categories")
                .insert({ cost_id: costId, category_id: categoryId });

              if (error) throw error;
            }
          }
        }
      } else if (operation === 'remove') {
        // Para remover: deletar as categorias especificadas
        for (const costId of costIds) {
          const { error } = await supabase
            .from("costs_categories")
            .delete()
            .eq("cost_id", costId)
            .in("category_id", categories);

          if (error) throw error;
        }
      }

      return { costIds, categories, operation };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      const operationText = {
        add: 'adicionadas',
        remove: 'removidas',
        replace: 'atualizadas'
      }[data.operation];
      toast.success(`Categorias ${operationText} em ${data.costIds.length} custo${data.costIds.length > 1 ? 's' : ''}!`);
    },
    onError: (error) => {
      console.error("Erro ao atualizar categorias em massa:", error);
      toast.error("Não foi possível atualizar as categorias");
    },
  });

  return {
    costs: costsQuery.data || [],
    isLoading: costsQuery.isLoading,
    error: costsQuery.error,
    createCost,
    updateCost,
    updateCostCategory,
    updateMultipleCostCategories,
    deleteCost,
    deleteCosts,
  };
};
