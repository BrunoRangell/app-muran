import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { formatDateInBrasiliaTz } from "@/components/daily-reviews/summary/utils";
import React from "react";

export interface CustomBudget {
  id: string;
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  status: 'active' | 'completed' | 'cancelled';
  is_active: boolean;
  client_name?: string;
}

export interface ClientWithBudgets {
  id: string;
  company_name: string;
  customBudgets: CustomBudget[];
}

export interface CustomBudgetFormData {
  clientId: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  description: string;
}

export const useCustomBudgets = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<CustomBudget | null>(null);

  // Buscar todos os orçamentos personalizados
  const { data: customBudgets, isLoading } = useQuery({
    queryKey: ["custom-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .select(`
          *,
          clients (
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar orçamentos personalizados:", error);
        throw error;
      }

      // Formatar os dados para incluir o nome do cliente
      return data.map((budget: any) => ({
        ...budget,
        client_name: budget.clients?.company_name
      }));
    },
  });

  // Buscar clientes para o dropdown
  const { data: clients } = useQuery({
    queryKey: ["clients-for-budget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .order('company_name', { ascending: true });

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      return data;
    },
  });

  // Filtrar clientes com base no termo de pesquisa
  const filteredClients = clients && customBudgets ? clients.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  ).map(client => {
    const clientBudgets = customBudgets.filter(
      (budget: CustomBudget) => budget.client_id === client.id
    );
    
    return {
      id: client.id,
      company_name: client.company_name,
      customBudgets: clientBudgets
    };
  }) : [];

  // Criar novo orçamento personalizado
  const addCustomBudgetMutation = useMutation({
    mutationFn: async (formData: CustomBudgetFormData) => {
      // Validar dados
      const errors = validateBudgetForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        console.error("Erros de validação:", errors);
        throw new Error("Formulário com erros");
      }

      console.log("Enviando dados para criação:", formData);

      // Remova o campo status do objeto de inserção, já que ele não existe na tabela
      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .insert({
          client_id: formData.clientId,
          budget_amount: formData.budgetAmount,
          start_date: formData.startDate,
          end_date: formData.endDate,
          description: formData.description || null,
          is_active: true  // Remova o campo status e use apenas is_active
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar orçamento personalizado:", error);
        throw error;
      }

      console.log("Orçamento criado com sucesso:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-budgets"] });
      setIsCreating(false);
      toast({
        title: "Orçamento personalizado criado",
        description: "O orçamento personalizado foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Erro na mutação addCustomBudgetMutation:", error);
      
      if (error.message !== "Formulário com erros") {
        toast({
          title: "Erro ao criar orçamento",
          description: "Não foi possível criar o orçamento personalizado: " + error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Atualizar orçamento personalizado
  const updateCustomBudgetMutation = useMutation({
    mutationFn: async ({ id, ...formData }: { id: string } & CustomBudgetFormData) => {
      // Validar dados
      const errors = validateBudgetForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        console.error("Erros de validação:", errors);
        throw new Error("Formulário com erros");
      }

      console.log("Enviando dados para atualização:", { id, ...formData });

      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .update({
          budget_amount: formData.budgetAmount,
          start_date: formData.startDate,
          end_date: formData.endDate,
          description: formData.description || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar orçamento personalizado:", error);
        throw error;
      }

      console.log("Orçamento atualizado com sucesso:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-budgets"] });
      setIsEditing(null);
      toast({
        title: "Orçamento personalizado atualizado",
        description: "O orçamento personalizado foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Erro na mutação updateCustomBudgetMutation:", error);
      
      if (error.message !== "Formulário com erros") {
        toast({
          title: "Erro ao atualizar orçamento",
          description: "Não foi possível atualizar o orçamento personalizado: " + error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Excluir orçamento personalizado
  const deleteCustomBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao excluir orçamento personalizado:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-budgets"] });
      toast({
        title: "Orçamento personalizado excluído",
        description: "O orçamento personalizado foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir orçamento",
        description: "Não foi possível excluir o orçamento personalizado.",
        variant: "destructive",
      });
    },
  });

  // Alternar status do orçamento (ativo/inativo)
  const toggleBudgetStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const { data, error } = await supabase
        .from("meta_custom_budgets")
        .update({
          is_active: isActive
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao alterar status do orçamento:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-budgets"] });
      toast({
        title: "Status alterado",
        description: "O status do orçamento foi alterado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do orçamento.",
        variant: "destructive",
      });
    },
  });
  
  // Validar formulário
  const validateBudgetForm = (formData: CustomBudgetFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    console.log("Validando dados:", formData);

    if (!formData.clientId) {
      errors.clientId = "Selecione um cliente";
    }

    if (!formData.budgetAmount || formData.budgetAmount <= 0) {
      errors.budgetAmount = "Informe um valor válido para o orçamento";
    }

    if (!formData.startDate) {
      errors.startDate = "Informe a data de início";
    }

    if (!formData.endDate) {
      errors.endDate = "Informe a data de término";
    }

    // Validar intervalo de datas
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      const result = validateDateRange(startDate, endDate);
      
      if (!result.valid) {
        errors.dateRange = result.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      console.log("Erros de validação encontrados:", errors);
    }

    return errors;
  };

  // Validar intervalo de datas
  const validateDateRange = (startDate: Date, endDate: Date) => {
    if (startDate > endDate) {
      return {
        valid: false,
        message: "A data de início deve ser anterior à data de término"
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Remover esta validação que não permite datas no passado
    // if (startDate < today) {
    //   return {
    //     valid: false,
    //     message: "A data de início não pode ser anterior a hoje"
    //   };
    // }

    // Calcular a diferença em dias
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 90) {
      return {
        valid: false,
        message: "O período máximo é de 90 dias"
      };
    }

    return { valid: true, message: "" };
  };

  // Limpar erros do formulário
  const clearFormErrors = () => {
    setFormErrors({});
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      // Garantir que a data tenha um horário fixo de meio-dia para evitar problemas de fuso
      const fullDate = `${dateString}T12:00:00`;
      const date = new Date(fullDate);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Data inválida para formatação:", dateString);
        return dateString; // Retorna a string original se inválida
      }
      
      // Formatar usando DD/MM/YYYY
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return dateString;
    }
  };

  // Formatar valor do orçamento
  const formatBudget = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Verificar se um orçamento está ativo
  const isCurrentlyActive = (budget: CustomBudget) => {
    if (!budget.is_active) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    
    return startDate <= today && endDate >= today;
  };

  // Verificar se um orçamento está agendado para o futuro
  const isFutureBudget = (budget: CustomBudget) => {
    if (!budget.is_active) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(budget.start_date);
    
    return startDate > today;
  };

  // Obter orçamentos ativos para um cliente específico
  const getActiveBudgetsForClient = (clientId: string) => {
    if (!customBudgets) return [];
    
    return customBudgets.filter((budget: CustomBudget) => 
      budget.client_id === clientId && 
      budget.is_active &&
      isCurrentlyActive(budget)
    );
  };

  return {
    customBudgets,
    clients,
    isLoading,
    isCreating,
    setIsCreating,
    isEditing,
    setIsEditing,
    formErrors,
    searchTerm,
    setSearchTerm,
    selectedBudget,
    setSelectedBudget,
    filteredClients,
    createBudget: addCustomBudgetMutation,
    updateBudget: updateCustomBudgetMutation,
    cancelBudget: deleteCustomBudgetMutation,
    clearFormErrors,
    formatDate,
    formatBudget,
    isCurrentlyActive,
    isFutureBudget,
    getActiveBudgetsForClient,
    // Adicionando as mutações necessárias
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation
  };
};
