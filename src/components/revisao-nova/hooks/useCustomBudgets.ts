import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CustomBudgetFormData {
  clientId: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  description?: string;
  platform?: string;
}

export const useCustomBudgets = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Buscar clientes com orçamentos personalizados
  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients-with-custom-budgets"],
    queryFn: async () => {
      // Buscar todos os clientes
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, company_name, status")
        .eq("status", "active")
        .order("company_name");

      if (clientsError) {
        toast({
          title: "Erro ao buscar clientes",
          description: clientsError.message,
          variant: "destructive",
        });
        return [];
      }

      // Buscar orçamentos personalizados
      const { data: metaCustomBudgets, error: metaCustomBudgetsError } = await supabase
        .from("meta_custom_budgets")
        .select("*");

      if (metaCustomBudgetsError) {
        toast({
          title: "Erro ao buscar orçamentos personalizados Meta",
          description: metaCustomBudgetsError.message,
          variant: "destructive",
        });
      }

      // Buscar orçamentos personalizados do Google
      const { data: googleCustomBudgets, error: googleCustomBudgetsError } = await supabase
        .from("custom_budgets")
        .select("*");

      if (googleCustomBudgetsError) {
        toast({
          title: "Erro ao buscar orçamentos personalizados Google",
          description: googleCustomBudgetsError.message,
          variant: "destructive",
        });
      }

      // Verificar data atual para destacar orçamentos ativos
      const today = new Date().toISOString().split("T")[0];

      // Combinar dados
      return clients?.map((client) => {
        const metaBudgets = metaCustomBudgets
          ?.filter((budget) => budget.client_id === client.id)
          .map(budget => ({
            ...budget,
            platform: "meta"  // Adicionar plataforma para diferenciar
          })) || [];
          
        const googleBudgets = googleCustomBudgets
          ?.filter((budget) => budget.client_id === client.id)
          .map(budget => ({
            ...budget,
            platform: budget.platform || "google"  // Garantir que tenha a plataforma
          })) || [];
          
        const allBudgets = [...metaBudgets, ...googleBudgets];

        return {
          ...client,
          custom_budgets: allBudgets,
          has_active_budget: allBudgets.some(
            (budget) => 
              budget.is_active && 
              budget.start_date <= today && 
              budget.end_date >= today
          ),
        };
      });
    },
  });

  // Filtrar clientes por termo de busca
  const filteredClients = (clients || []).filter((client) =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutation para adicionar novo orçamento personalizado
  const addCustomBudgetMutation = useMutation({
    mutationFn: async (data: CustomBudgetFormData) => {
      const table = data.platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      // Formato do payload depende da tabela
      const payload = data.platform === "meta" 
        ? {
            client_id: data.clientId,
            budget_amount: data.budgetAmount,
            start_date: data.startDate,
            end_date: data.endDate,
            description: data.description,
            is_active: true,
          }
        : {
            client_id: data.clientId,
            budget_amount: data.budgetAmount,
            start_date: data.startDate,
            end_date: data.endDate,
            description: data.description,
            is_active: true,
            platform: "google",
          };
      
      const { data: result, error } = await supabase
        .from(table)
        .insert(payload)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento personalizado criado",
        description: "O orçamento personalizado foi criado com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar orçamento personalizado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar orçamento personalizado
  const updateCustomBudgetMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: CustomBudgetFormData & { id: string }) => {
      const table = data.platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      // Formato do payload depende da tabela
      const payload = data.platform === "meta" 
        ? {
            budget_amount: data.budgetAmount,
            start_date: data.startDate,
            end_date: data.endDate,
            description: data.description,
          }
        : {
            budget_amount: data.budgetAmount,
            start_date: data.startDate,
            end_date: data.endDate,
            description: data.description,
            platform: "google",
          };
      
      const { data: result, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento personalizado atualizado",
        description: "O orçamento personalizado foi atualizado com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar orçamento personalizado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir orçamento personalizado
  const deleteCustomBudgetMutation = useMutation({
    mutationFn: async (budgetInfo: {id: string, platform: string}) => {
      const table = budgetInfo.platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", budgetInfo.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento personalizado excluído",
        description: "O orçamento personalizado foi excluído com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir orçamento personalizado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para ativar/desativar orçamento personalizado
  const toggleBudgetStatusMutation = useMutation({
    mutationFn: async ({ id, isActive, platform }: { id: string; isActive: boolean, platform: string }) => {
      const table = platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Status do orçamento alterado",
        description: "O status do orçamento foi alterado com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar status do orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formatar data - Corrigida para usar date-fns corretamente
  const formatDate = (dateString: string) => {
    try {
      // Garantir que estamos recebendo uma data válida
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Data inválida:", dateString);
        return dateString;
      }
      
      // Formatar a data no padrão brasileiro sem conversão de fuso horário
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dateString;
    }
  };

  // Formatar valor do orçamento
  const formatBudget = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Verificar se o orçamento está atualmente ativo
  const isCurrentlyActive = (budget: any) => {
    const today = new Date().toISOString().split("T")[0];
    return (
      budget.is_active &&
      budget.start_date <= today &&
      budget.end_date >= today
    );
  };

  // Verificar se o orçamento é para o futuro
  const isFutureBudget = (budget: any) => {
    const today = new Date().toISOString().split("T")[0];
    return budget.start_date > today;
  };

  return {
    clients,
    filteredClients,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedBudget,
    setSelectedBudget,
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation,
    formatDate,
    formatBudget,
    isCurrentlyActive,
    isFutureBudget,
  };
};
