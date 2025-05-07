
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface CustomBudgetFormData {
  clientId: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  platform: string;
  accountId?: string;
  description?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export interface CustomBudget extends CustomBudgetFormData {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseCustomBudgetsParams {
  filter?: 'active' | 'all' | 'inactive';
  platform?: 'meta' | 'google' | 'all';
}

export function useCustomBudgets({ filter = 'all', platform = 'all' }: UseCustomBudgetsParams = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBudget, setSelectedBudget] = useState<CustomBudget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para carregar os orçamentos
  const { data: budgets, isLoading, error, refetch } = useQuery({
    queryKey: ['custom-budgets', filter, platform],
    queryFn: async () => {
      let query = supabase
        .from("custom_budgets")
        .select("*");

      // Aplicar filtro de status
      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Aplicar filtro de plataforma
      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      // Ordenar por data de criação (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar orçamentos: ${error.message}`);
      }

      return data.map(transformBudgetFromDb);
    },
  });

  // Função para adicionar um novo orçamento
  const addBudgetMutation = useMutation({
    mutationFn: async (newBudget: CustomBudgetFormData) => {
      const { data, error } = await supabase
        .from("custom_budgets")
        .insert([
          {
            client_id: newBudget.clientId,
            budget_amount: newBudget.budgetAmount,
            start_date: newBudget.startDate,
            end_date: newBudget.endDate,
            platform: newBudget.platform,
            account_id: newBudget.accountId || null,
            description: newBudget.description || "",
            is_active: true,
            is_recurring: newBudget.isRecurring || false,
            recurrence_pattern: newBudget.recurrencePattern || null
          },
        ])
        .select("*")
        .single();

      if (error) {
        throw new Error(`Erro ao adicionar orçamento: ${error.message}`);
      }

      return transformBudgetFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento adicionado",
        description: "Orçamento personalizado adicionado com sucesso.",
      });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para atualizar um orçamento existente
  const updateBudgetMutation = useMutation({
    mutationFn: async (budget: CustomBudget) => {
      const { data, error } = await supabase
        .from("custom_budgets")
        .update({
          client_id: budget.clientId,
          budget_amount: budget.budgetAmount,
          start_date: budget.startDate,
          end_date: budget.endDate,
          platform: budget.platform,
          account_id: budget.accountId || null,
          description: budget.description || "",
          is_recurring: budget.isRecurring || false,
          recurrence_pattern: budget.recurrencePattern || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", budget.id)
        .select("*")
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar orçamento: ${error.message}`);
      }

      return transformBudgetFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento atualizado",
        description: "Orçamento personalizado atualizado com sucesso.",
      });
      setIsModalOpen(false);
      setSelectedBudget(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para ativar/desativar um orçamento
  const toggleBudgetStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("custom_budgets")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        throw new Error(`Erro ao ${isActive ? 'ativar' : 'desativar'} orçamento: ${error.message}`);
      }

      return transformBudgetFromDb(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: variables.isActive ? "Orçamento ativado" : "Orçamento desativado",
        description: variables.isActive 
          ? "O orçamento personalizado foi ativado com sucesso." 
          : "O orçamento personalizado foi desativado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para excluir um orçamento
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_budgets")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Erro ao excluir orçamento: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento excluído",
        description: "Orçamento personalizado excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers para gerenciar o estado do modal e do orçamento selecionado
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBudget(null);
  }, []);

  const selectBudgetForEdit = useCallback((budget: CustomBudget) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  }, []);

  // Submeter o formulário - criar novo ou atualizar existente
  const handleSubmit = useCallback((data: CustomBudgetFormData) => {
    if (selectedBudget) {
      updateBudgetMutation.mutate({
        ...selectedBudget,
        ...data
      });
    } else {
      addBudgetMutation.mutate(data);
    }
  }, [selectedBudget, addBudgetMutation, updateBudgetMutation]);

  // Função para ajudar na transformação dos dados do banco
  function transformBudgetFromDb(dbBudget: any): CustomBudget {
    return {
      id: dbBudget.id,
      clientId: dbBudget.client_id,
      budgetAmount: dbBudget.budget_amount,
      startDate: dbBudget.start_date,
      endDate: dbBudget.end_date,
      platform: dbBudget.platform,
      accountId: dbBudget.account_id,
      description: dbBudget.description,
      isActive: dbBudget.is_active,
      isRecurring: dbBudget.is_recurring,
      recurrencePattern: dbBudget.recurrence_pattern,
      createdAt: dbBudget.created_at,
      updatedAt: dbBudget.updated_at
    };
  }

  return {
    budgets,
    isLoading,
    error,
    refetch,
    isModalOpen,
    openModal,
    closeModal,
    selectedBudget,
    selectBudgetForEdit,
    handleSubmit,
    isSubmitting: addBudgetMutation.isPending || updateBudgetMutation.isPending,
    toggleBudgetStatus: toggleBudgetStatusMutation.mutate,
    isToggling: toggleBudgetStatusMutation.isPending,
    deleteBudget: deleteBudgetMutation.mutate,
    isDeleting: deleteBudgetMutation.isPending,
  };
}
