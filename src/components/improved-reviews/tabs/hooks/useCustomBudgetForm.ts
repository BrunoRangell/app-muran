
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CustomBudgetFormData } from "../schemas/customBudgetSchema";

export const useCustomBudgetForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBudgetMutation = useMutation({
    mutationFn: async (data: CustomBudgetFormData) => {
      const { error } = await supabase
        .from('custom_budgets')
        .insert({
          client_id: data.client_id,
          platform: data.platform,
          budget_amount: data.budget_amount,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date.toISOString().split('T')[0],
          description: data.description || null,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento criado",
        description: "O orçamento personalizado foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: "Erro ao criar orçamento",
        description: "Não foi possível criar o orçamento personalizado.",
        variant: "destructive",
      });
    }
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomBudgetFormData }) => {
      const { error } = await supabase
        .from('custom_budgets')
        .update({
          client_id: data.client_id,
          platform: data.platform,
          budget_amount: data.budget_amount,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date.toISOString().split('T')[0],
          description: data.description || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento personalizado foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar orçamento:', error);
      toast({
        title: "Erro ao atualizar orçamento",
        description: "Não foi possível atualizar o orçamento personalizado.",
        variant: "destructive",
      });
    }
  });

  return {
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
  };
};
