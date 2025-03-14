
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "@/components/daily-reviews/summary/utils";

export interface CustomBudget {
  id: string;
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomBudgetForm {
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  description: string | null;
}

export interface ClientWithBudgets {
  id: string;
  company_name: string;
  customBudgets: CustomBudget[];
}

export const useCustomBudgets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBudget, setSelectedBudget] = useState<CustomBudget | null>(null);

  // Buscar clientes ativos com seus orçamentos personalizados
  const { data: clientsWithBudgets, isLoading } = useQuery({
    queryKey: ["clients-with-custom-budgets"],
    queryFn: async () => {
      // Primeiro buscar todos os clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("status", "active")
        .order("company_name");

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Buscar orçamentos personalizados para todos os clientes
      const { data: customBudgets, error: budgetsError } = await supabase
        .from("meta_custom_budgets")
        .select("*")
        .order("start_date", { ascending: false });

      if (budgetsError) {
        console.error("Erro ao buscar orçamentos personalizados:", budgetsError);
        throw budgetsError;
      }

      // Mapear clientes com seus orçamentos
      const clientsWithBudgetsData = clients.map((client) => ({
        ...client,
        customBudgets: customBudgets.filter(
          (budget) => budget.client_id === client.id
        ),
      }));

      return clientsWithBudgetsData as ClientWithBudgets[];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Filtrar clientes com base no termo de busca
  const filteredClients = clientsWithBudgets?.filter((client) =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para invalidar queries após mutações
  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["clients-with-custom-budgets"] });
    queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
  };

  // Mutation para adicionar novo orçamento personalizado
  const addCustomBudgetMutation = useMutation({
    mutationFn: async (budgetData: CustomBudgetForm) => {
      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .insert([budgetData])
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar orçamento personalizado:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento adicionado",
        description: "Orçamento personalizado adicionado com sucesso.",
      });
      invalidateRelatedQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar orçamento",
        description: error.message || "Ocorreu um erro ao adicionar o orçamento.",
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar orçamento personalizado
  const updateCustomBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: CustomBudgetForm & { id: string }) => {
      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .update(budgetData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar orçamento personalizado:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento atualizado",
        description: "Orçamento personalizado atualizado com sucesso.",
      });
      invalidateRelatedQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message || "Ocorreu um erro ao atualizar o orçamento.",
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir orçamento personalizado
  const deleteCustomBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meta_custom_budgets")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao excluir orçamento personalizado:", error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento excluído",
        description: "Orçamento personalizado excluído com sucesso.",
      });
      invalidateRelatedQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir orçamento",
        description: error.message || "Ocorreu um erro ao excluir o orçamento.",
        variant: "destructive",
      });
    }
  });

  // Mutation para alterar status do orçamento (ativo/inativo)
  const toggleBudgetStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao alterar status do orçamento:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "Status do orçamento atualizado com sucesso.",
      });
      invalidateRelatedQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status.",
        variant: "destructive",
      });
    }
  });

  // Formatadores de data e moeda para exibição
  const formatDate = (dateString: string) => {
    return formatDateInBrasiliaTz(dateString, "dd/MM/yyyy");
  };

  const formatBudget = (value: number) => {
    return formatCurrency(value);
  };

  // Verificar se um orçamento está ativo na data atual
  const isCurrentlyActive = (budget: CustomBudget) => {
    if (!budget.is_active) return false;
    
    const today = new Date();
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    
    return startDate <= today && today <= endDate;
  };

  // Verificar se um orçamento é futuro (ainda não começou)
  const isFutureBudget = (budget: CustomBudget) => {
    if (!budget.is_active) return false;
    
    const today = new Date();
    const startDate = new Date(budget.start_date);
    
    return startDate > today;
  };

  return {
    clientsWithBudgets,
    filteredClients,
    isLoading,
    searchTerm,
    setSearchTerm,
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation,
    formatDate,
    formatBudget,
    isCurrentlyActive,
    isFutureBudget,
    selectedBudget,
    setSelectedBudget
  };
};
