
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBudgets } from "../context/BudgetContext";
import { useToast } from "@/hooks/use-toast";
import { 
  CustomBudget, 
  CustomBudgetDatabase, 
  dbToCustomBudget, 
  customBudgetToDb 
} from "../context/types";

export function useBudgetManagerV2() {
  const { state, dispatch } = useBudgets();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Buscar orçamentos personalizados
  const { data: customBudgetsData, refetch: refetchCustomBudgets } = useQuery({
    queryKey: ["customBudgetsV2"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("custom_budgets")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;

        // Converter dados do banco para o modelo da aplicação e agrupar por clientId
        const groupedBudgets: Record<string, CustomBudget[]> = {};
        data.forEach((budget: CustomBudgetDatabase) => {
          const customBudget = dbToCustomBudget(budget);
          if (!groupedBudgets[customBudget.clientId]) {
            groupedBudgets[customBudget.clientId] = [];
          }
          groupedBudgets[customBudget.clientId].push(customBudget);
        });

        return groupedBudgets;
      } catch (error) {
        console.error("Erro ao buscar orçamentos personalizados:", error);
        throw error;
      }
    },
  });

  // Atualizar estado quando os dados são carregados
  useEffect(() => {
    if (customBudgetsData) {
      dispatch({ type: "SET_CUSTOM_BUDGETS", payload: customBudgetsData });
    }
  }, [customBudgetsData, dispatch]);

  // Mutation para criar orçamento personalizado
  const createBudgetMutation = useMutation({
    mutationFn: async (budget: Omit<CustomBudget, "id">) => {
      // Converter para o formato esperado pelo banco
      const dbBudget = customBudgetToDb(budget);
      
      const { data, error } = await supabase
        .from("custom_budgets")
        .insert([dbBudget])
        .select()
        .single();

      if (error) throw error;
      return dbToCustomBudget(data as CustomBudgetDatabase);
    },
    onSuccess: (data) => {
      dispatch({ type: "ADD_CUSTOM_BUDGET", payload: data });
      toast({
        title: "Orçamento personalizado criado",
        description: "O orçamento personalizado foi criado com sucesso.",
      });
      refetchCustomBudgets();
    },
    onError: (error) => {
      console.error("Erro ao criar orçamento personalizado:", error);
      toast({
        title: "Erro ao criar orçamento",
        description: "Não foi possível criar o orçamento personalizado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar orçamento personalizado
  const updateBudgetMutation = useMutation({
    mutationFn: async (budget: CustomBudget) => {
      // Converter para o formato esperado pelo banco
      const dbBudget = customBudgetToDb(budget);
      
      const { data, error } = await supabase
        .from("custom_budgets")
        .update(dbBudget)
        .eq("id", budget.id)
        .select()
        .single();

      if (error) throw error;
      return dbToCustomBudget(data as CustomBudgetDatabase);
    },
    onSuccess: (data) => {
      dispatch({ type: "UPDATE_CUSTOM_BUDGET", payload: data });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento personalizado foi atualizado com sucesso.",
      });
      refetchCustomBudgets();
    },
    onError: (error) => {
      console.error("Erro ao atualizar orçamento personalizado:", error);
      toast({
        title: "Erro ao atualizar orçamento",
        description: "Não foi possível atualizar o orçamento personalizado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir orçamento personalizado
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      dispatch({ type: "DELETE_CUSTOM_BUDGET", payload: { id } });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento personalizado foi excluído com sucesso.",
      });
      refetchCustomBudgets();
    },
    onError: (error) => {
      console.error("Erro ao excluir orçamento personalizado:", error);
      toast({
        title: "Erro ao excluir orçamento",
        description: "Não foi possível excluir o orçamento personalizado.",
        variant: "destructive",
      });
    },
  });

  return {
    budgets: state.customBudgets,
    processing: state.processing,
    error: state.error,
    selectedClientId,
    setSelectedClientId,
    refetchBudgets: refetchCustomBudgets,
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
  };
}
