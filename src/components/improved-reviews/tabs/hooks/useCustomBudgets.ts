
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomBudget {
  id: string;
  client_id: string;
  platform: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
  clients?: {
    company_name: string;
  };
}

export const useCustomBudgets = (searchQuery?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar orçamentos personalizados
  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['custom-budgets', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('custom_budgets')
        .select(`
          *,
          clients (
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtro de busca se fornecido
      if (searchQuery && searchQuery.trim()) {
        query = query.or(`clients.company_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar orçamentos personalizados:', error);
        throw error;
      }

      return data as CustomBudget[];
    }
  });

  // Mutação para deletar orçamento
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('custom_budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento personalizado foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o orçamento personalizado.",
        variant: "destructive",
      });
    }
  });

  // Mutação para alternar status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ budgetId, isActive }: { budgetId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('custom_budgets')
        .update({ is_active: !isActive })
        .eq('id', budgetId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: isActive ? "Orçamento desativado" : "Orçamento ativado",
        description: `O orçamento foi ${isActive ? 'desativado' : 'ativado'} com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao alterar status do orçamento:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do orçamento.",
        variant: "destructive",
      });
    }
  });

  return {
    budgets,
    isLoading,
    error,
    deleteBudget: deleteBudgetMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    isDeleting: deleteBudgetMutation.isPending,
    isToggling: toggleStatusMutation.isPending
  };
};
