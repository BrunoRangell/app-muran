
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Definição de tipos
export interface CustomBudget {
  id: string;
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  isActive: boolean;
  description?: string;
  platform: string;
  account_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
}

export interface ClientWithBudgets {
  client: Client;
  budgets: CustomBudget[];
}

export interface CustomBudgetFormData {
  clientId: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  platform: 'meta' | 'google';
  description?: string;
  isRecurring?: boolean;
  recurrencePattern?: string | null;
}

export interface UseCustomBudgetsParams {
  clientId?: string;
  platform?: string;
  includeFuture?: boolean;
  includeExpired?: boolean;
  filterActive?: boolean;
  sortBy?: string;
}

// Hook principal para gerenciar orçamentos personalizados
export const useCustomBudgets = ({
  clientId,
  platform = "meta",
  includeFuture = true,
  includeExpired = false,
  filterActive = false,
  sortBy = "date"
}: UseCustomBudgetsParams = {}) => {
  const [selectedBudget, setSelectedBudget] = useState<CustomBudget | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar orçamentos personalizados
  const fetchCustomBudgets = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from("custom_budgets")
      .select("*, clients(id, company_name)")
      .eq("platform", platform);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (filterActive) {
      query = query.eq("isActive", true);
    }

    // Filtrar orçamentos com base nas datas
    if (!includeFuture && !includeExpired) {
      query = query
        .lte("start_date", today)
        .gte("end_date", today);
    } else if (!includeFuture) {
      query = query.lte("start_date", today);
    } else if (!includeExpired) {
      query = query.gte("end_date", today);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar orçamentos personalizados: ${error.message}`);
    }

    // Agrupar orçamentos por cliente
    const clientBudgetsMap = data.reduce((acc: { [key: string]: ClientWithBudgets }, row: any) => {
      const clientId = row.client_id;
      const budget: CustomBudget = {
        id: row.id,
        client_id: row.client_id,
        budget_amount: row.budget_amount,
        start_date: row.start_date,
        end_date: row.end_date,
        isActive: row.is_active,
        description: row.description,
        platform: row.platform,
        account_id: row.account_id,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      if (!acc[clientId]) {
        acc[clientId] = {
          client: {
            id: row.clients.id,
            company_name: row.clients.company_name
          },
          budgets: []
        };
      }

      acc[clientId].budgets.push(budget);
      return acc;
    }, {});

    return Object.values(clientBudgetsMap);
  };

  // Buscar clientes ativos
  const fetchActiveClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, company_name")
      .eq("status", "active");

    if (error) {
      throw new Error(`Erro ao buscar clientes: ${error.message}`);
    }

    return data;
  };

  // Adicionar orçamento personalizado
  const addCustomBudget = async (newBudget: Omit<CustomBudget, 'id' | 'created_at' | 'updated_at'>) => {
    // Correção do nome do campo is_active para compatibilidade com o banco de dados
    const { data, error } = await supabase
      .from("custom_budgets")
      .insert({
        client_id: newBudget.client_id,
        budget_amount: newBudget.budget_amount,
        start_date: newBudget.start_date,
        end_date: newBudget.end_date,
        is_active: newBudget.isActive,
        description: newBudget.description,
        platform: newBudget.platform,
        account_id: newBudget.account_id || null
      })
      .select();

    if (error) {
      throw new Error(`Erro ao adicionar orçamento: ${error.message}`);
    }

    return data[0];
  };

  // Atualizar orçamento personalizado
  const updateCustomBudget = async (budget: Partial<CustomBudget> & { id: string }) => {
    // Converter isActive para is_active para compatibilidade com o banco de dados
    const updatePayload: any = { ...budget };
    
    if ('isActive' in updatePayload) {
      updatePayload.is_active = updatePayload.isActive;
      delete updatePayload.isActive;
    }

    const { data, error } = await supabase
      .from("custom_budgets")
      .update(updatePayload)
      .eq("id", budget.id)
      .select();

    if (error) {
      throw new Error(`Erro ao atualizar orçamento: ${error.message}`);
    }

    return data[0];
  };

  // Excluir orçamento personalizado
  const deleteCustomBudget = async (id: string) => {
    const { error } = await supabase
      .from("custom_budgets")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao excluir orçamento: ${error.message}`);
    }

    return id;
  };

  // Ativar/desativar orçamento personalizado
  const toggleBudgetStatus = async ({ id, isActive }: { id: string; isActive: boolean }) => {
    const { data, error } = await supabase
      .from("custom_budgets")
      .update({ is_active: isActive })
      .eq("id", id)
      .select();

    if (error) {
      throw new Error(`Erro ao ${isActive ? 'ativar' : 'desativar'} orçamento: ${error.message}`);
    }

    return data[0];
  };

  // Duplicar orçamento personalizado
  const duplicateBudget = async (budget: CustomBudget) => {
    const { data, error } = await supabase
      .from("custom_budgets")
      .insert({
        client_id: budget.client_id,
        budget_amount: budget.budget_amount,
        start_date: budget.start_date,
        end_date: budget.end_date,
        is_active: false, // Novo orçamento sempre começa desativado
        description: `Cópia de: ${budget.description || 'Orçamento'}`,
        platform: budget.platform,
        account_id: budget.account_id
      })
      .select();

    if (error) {
      throw new Error(`Erro ao duplicar orçamento: ${error.message}`);
    }

    return data[0];
  };

  // Configurar query e mutations
  const {
    data: clientsWithBudgets = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['custom-budgets', platform, clientId, includeFuture, includeExpired, filterActive],
    queryFn: fetchCustomBudgets
  });

  const { data: activeClients = [] } = useQuery({
    queryKey: ['active-clients'],
    queryFn: fetchActiveClients
  });

  // Mutations
  const addCustomBudgetMutation = useMutation({
    mutationFn: addCustomBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento adicionado",
        description: "O orçamento personalizado foi adicionado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateCustomBudgetMutation = useMutation({
    mutationFn: updateCustomBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento personalizado foi atualizado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteCustomBudgetMutation = useMutation({
    mutationFn: deleteCustomBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento personalizado foi excluído com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleBudgetStatusMutation = useMutation({
    mutationFn: toggleBudgetStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: data.is_active ? "Orçamento ativado" : "Orçamento desativado",
        description: `O orçamento personalizado foi ${data.is_active ? 'ativado' : 'desativado'} com sucesso.`
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const duplicateBudgetMutation = useMutation({
    mutationFn: duplicateBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-budgets'] });
      toast({
        title: "Orçamento duplicado",
        description: "O orçamento personalizado foi duplicado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao duplicar orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Preparar dados filtrados
  const filteredClients = clientsWithBudgets.filter((clientWithBudget) => {
    if (!searchTerm) return true;
    return clientWithBudget.client.company_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Formatadores e auxiliares
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      console.error(`Erro ao formatar data ${date}:`, error);
      return date;
    }
  };

  const formatBudget = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Verificar se o orçamento está ativo agora
  const isCurrentlyActive = (budget: CustomBudget) => {
    const today = new Date();
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    return budget.isActive && startDate <= today && endDate >= today;
  };

  // Verificar se o orçamento é futuro
  const isFutureBudget = (budget: CustomBudget) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(budget.start_date).setHours(0, 0, 0, 0);
    return startDate > today;
  };

  // Exportar dados para CSV
  const exportToCSV = () => {
    // Implementação para exportar dados para CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Cliente,Valor,Data Início,Data Fim,Status,Descrição\n";

    clientsWithBudgets.forEach(({ client, budgets }) => {
      budgets.forEach(budget => {
        const row = [
          client.company_name.replace(/,/g, ";"),
          budget.budget_amount,
          budget.start_date,
          budget.end_date,
          budget.isActive ? "Ativo" : "Inativo",
          budget.description?.replace(/,/g, ";") || ""
        ].join(",");
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orcamentos_personalizados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcular estatísticas gerais dos orçamentos
  const getBudgetStats = () => {
    let totalBudgets = 0;
    let totalAmount = 0;
    let activeBudgets = 0;
    let clientsWithBudget = new Set();

    clientsWithBudgets.forEach(({ budgets }) => {
      totalBudgets += budgets.length;
      
      budgets.forEach(budget => {
        totalAmount += budget.budget_amount;
        if (isCurrentlyActive(budget)) {
          activeBudgets++;
          clientsWithBudget.add(budget.client_id);
        }
      });
    });

    return {
      totalBudgets,
      totalAmount,
      activeBudgets,
      clientsWithBudget: clientsWithBudget.size
    };
  };

  return {
    budgets: clientsWithBudgets,
    isLoading,
    error,
    refetch,
    activeClients,
    filteredClients: clientsWithBudgets.filter((clientWithBudget) => {
      if (!searchTerm) return true;
      return clientWithBudget.client.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    }),
    searchTerm,
    setSearchTerm,
    selectedBudget,
    setSelectedBudget,
    isAdding: addCustomBudgetMutation.isPending,
    isUpdating: updateCustomBudgetMutation.isPending,
    isDeleting: deleteCustomBudgetMutation.isPending,
    isTogglingStatus: toggleBudgetStatusMutation.isPending,
    isDuplicating: duplicateBudgetMutation.isPending,
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
};
