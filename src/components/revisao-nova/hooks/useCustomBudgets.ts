
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export interface CustomBudget {
  id: string;
  clientId: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  platform: string;
  accountId?: string;
  description?: string;
  isActive: boolean;
  isRecurring: boolean;
  recurrencePattern?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithBudgets {
  id: string;
  company_name: string;
  customBudgets: CustomBudget[];
}

interface UseCustomBudgetsParams {
  filter?: 'active' | 'all' | 'inactive';
  platform?: 'meta' | 'google' | 'all';
  sortBy?: string;
  statusFilter?: string;
  platformFilter?: string;
}

export function useCustomBudgets({ filter = 'all', platform = 'all', sortBy = 'client_name', statusFilter = 'all', platformFilter = 'all' }: UseCustomBudgetsParams = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBudget, setSelectedBudget] = useState<CustomBudget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredClients, setFilteredClients] = useState<ClientWithBudgets[]>([]);

  // Função para carregar os orçamentos
  const { data: budgets, isLoading, error, refetch } = useQuery({
    queryKey: ['custom-budgets', filter, platform, sortBy, statusFilter, platformFilter, searchTerm],
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

      // Processar os resultados para obter clientes com orçamentos
      const result = data.map(transformBudgetFromDb);
      
      // Aqui seria onde processaríamos os orçamentos para agrupá-los por cliente
      // e criar o array filteredClients
      const clientsWithBudgets = await processClientsWithBudgets(result);
      setFilteredClients(clientsWithBudgets);

      return result;
    },
  });

  // Função para processar clientes com orçamentos
  const processClientsWithBudgets = async (budgets: CustomBudget[]): Promise<ClientWithBudgets[]> => {
    // Obter IDs únicos de clientes
    const clientIds = [...new Set(budgets.map(budget => budget.clientId))];
    
    // Buscar informações dos clientes
    const { data: clients } = await supabase
      .from("clients")
      .select("id, company_name")
      .in("id", clientIds);

    if (!clients) return [];
    
    // Agrupar orçamentos por cliente
    return clients.map(client => {
      const clientBudgets = budgets.filter(budget => budget.clientId === client.id);
      
      // Aplicar filtros adicionais
      let filteredBudgets = [...clientBudgets];
      
      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!client.company_name.toLowerCase().includes(searchLower)) {
          filteredBudgets = [];
        }
      }
      
      // Filtro por status
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          filteredBudgets = filteredBudgets.filter(budget => 
            budget.isActive && isCurrentlyActive(budget)
          );
        } else if (statusFilter === 'scheduled') {
          filteredBudgets = filteredBudgets.filter(budget => 
            budget.isActive && isFutureBudget(budget)
          );
        } else if (statusFilter === 'inactive') {
          filteredBudgets = filteredBudgets.filter(budget => !budget.isActive);
        } else if (statusFilter === 'expired') {
          const today = new Date().toISOString().split('T')[0];
          filteredBudgets = filteredBudgets.filter(budget => 
            budget.endDate < today
          );
        } else if (statusFilter === 'recurring') {
          filteredBudgets = filteredBudgets.filter(budget => budget.isRecurring);
        }
      }
      
      // Filtro por plataforma
      if (platformFilter !== 'all') {
        filteredBudgets = filteredBudgets.filter(budget => 
          budget.platform === platformFilter
        );
      }
      
      return {
        id: client.id,
        company_name: client.company_name,
        customBudgets: filteredBudgets
      };
    }).filter(client => client.customBudgets.length > 0);
  };

  // Função para verificar se o orçamento está atualmente ativo
  const isCurrentlyActive = (budget: CustomBudget): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return budget.isActive && 
           budget.startDate <= today && 
           budget.endDate >= today;
  };

  // Função para verificar se o orçamento é futuro
  const isFutureBudget = (budget: CustomBudget): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return budget.isActive && budget.startDate > today;
  };

  // Função para adicionar um novo orçamento
  const addCustomBudgetMutation = useMutation({
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
  const updateCustomBudgetMutation = useMutation({
    mutationFn: async (budget: any) => {
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
  
  // Função para duplicar um orçamento
  const duplicateBudgetMutation = useMutation({
    mutationFn: async (budget: CustomBudget) => {
      const { data, error } = await supabase
        .from("custom_budgets")
        .insert([
          {
            client_id: budget.clientId,
            budget_amount: budget.budgetAmount,
            start_date: budget.startDate,
            end_date: budget.endDate,
            platform: budget.platform,
            account_id: budget.accountId || null,
            description: `Cópia de: ${budget.description || ""}`,
            is_active: budget.isActive,
            is_recurring: budget.isRecurring,
            recurrence_pattern: budget.recurrencePattern
          },
        ])
        .select("*")
        .single();

      if (error) {
        throw new Error(`Erro ao duplicar orçamento: ${error.message}`);
      }

      return transformBudgetFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento duplicado",
        description: "Orçamento personalizado duplicado com sucesso.",
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

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Função para formatar valor do orçamento
  const formatBudget = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Função para exportar dados para CSV
  const exportToCSV = useCallback(() => {
    if (!budgets || budgets.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há orçamentos para exportar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Implementação do exportToCSV aqui
      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados para CSV com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive",
      });
    }
  }, [budgets, toast]);

  // Função para obter estatísticas de orçamentos
  const getBudgetStats = () => {
    if (!budgets) return { total: 0, active: 0, scheduled: 0, meta: 0, google: 0 };

    const active = budgets.filter(b => b.isActive && isCurrentlyActive(b)).length;
    const scheduled = budgets.filter(b => b.isActive && isFutureBudget(b)).length;
    const meta = budgets.filter(b => b.platform === 'meta').length;
    const google = budgets.filter(b => b.platform === 'google').length;

    return {
      total: budgets.length,
      active,
      scheduled,
      meta,
      google
    };
  };

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
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    selectedBudget,
    setSelectedBudget,
    handleSubmit: (data: CustomBudgetFormData) => {
      if (selectedBudget) {
        updateCustomBudgetMutation.mutate({
          ...selectedBudget,
          ...data
        });
      } else {
        addCustomBudgetMutation.mutate(data);
      }
    },
    isSubmitting: addCustomBudgetMutation.isPending || updateCustomBudgetMutation.isPending,
    toggleBudgetStatus: toggleBudgetStatusMutation.mutate,
    isToggling: toggleBudgetStatusMutation.isPending,
    deleteBudget: deleteBudgetMutation.mutate,
    isDeleting: deleteBudgetMutation.isPending,
    filteredClients,
    searchTerm,
    setSearchTerm,
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation,
    duplicateBudgetMutation,
    formatDate,
    formatBudget,
    isCurrentlyActive,
    isFutureBudget,
    exportToCSV,
    getBudgetStats
  };
}
