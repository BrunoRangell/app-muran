import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { formatDateInBrasiliaTz } from "@/components/daily-reviews/summary/utils";

export interface CustomBudget {
  id: string;
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  status: 'active' | 'completed' | 'cancelled';
  client_name?: string;
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

  // Buscar todos os orçamentos personalizados
  const { data: customBudgets, isLoading } = useQuery({
    queryKey: ["custom-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_budgets")
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

  // Criar novo orçamento personalizado
  const createBudget = useMutation({
    mutationFn: async (formData: CustomBudgetFormData) => {
      // Validar dados
      const errors = validateBudgetForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        throw new Error("Formulário com erros");
      }

      const { data, error } = await supabase
        .from("custom_budgets")
        .insert({
          client_id: formData.clientId,
          budget_amount: formData.budgetAmount,
          start_date: formData.startDate,
          end_date: formData.endDate,
          description: formData.description || null,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar orçamento personalizado:", error);
        throw error;
      }

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
    onError: (error) => {
      if (error.message !== "Formulário com erros") {
        toast({
          title: "Erro ao criar orçamento",
          description: "Não foi possível criar o orçamento personalizado.",
          variant: "destructive",
        });
      }
    },
  });

  // Atualizar orçamento personalizado
  const updateBudget = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: CustomBudgetFormData }) => {
      // Validar dados
      const errors = validateBudgetForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        throw new Error("Formulário com erros");
      }

      const { data, error } = await supabase
        .from("custom_budgets")
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
    onError: (error) => {
      if (error.message !== "Formulário com erros") {
        toast({
          title: "Erro ao atualizar orçamento",
          description: "Não foi possível atualizar o orçamento personalizado.",
          variant: "destructive",
        });
      }
    },
  });

  // Cancelar orçamento personalizado
  const cancelBudget = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("custom_budgets")
        .update({
          status: 'cancelled'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao cancelar orçamento personalizado:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-budgets"] });
      toast({
        title: "Orçamento personalizado cancelado",
        description: "O orçamento personalizado foi cancelado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar orçamento",
        description: "Não foi possível cancelar o orçamento personalizado.",
        variant: "destructive",
      });
    },
  });

  // Validar formulário
  const validateBudgetForm = (formData: CustomBudgetFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

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
      
      const result = validateDateRange(
        typeof startDate === 'string' ? new Date(startDate) : startDate,
        typeof endDate === 'string' ? new Date(endDate) : endDate
      );
      
      if (!result.valid) {
        errors.dateRange = result.message;
      }
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

    if (startDate < today) {
      return {
        valid: false,
        message: "A data de início não pode ser anterior a hoje"
      };
    }

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
    return formatDateInBrasiliaTz(new Date(dateString), "dd/MM/yyyy");
  };

  // Verificar se um orçamento está ativo
  const isBudgetActive = (budget: CustomBudget) => {
    return budget.status === 'active';
  };

  // Verificar se um orçamento está no período atual
  const isBudgetCurrent = (budget: CustomBudget) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    
    return startDate <= today && endDate >= today && budget.status === 'active';
  };

  // Obter orçamentos ativos para um cliente específico
  const getActiveBudgetsForClient = (clientId: string) => {
    if (!customBudgets) return [];
    
    return customBudgets.filter((budget: CustomBudget) => 
      budget.client_id === clientId && 
      isBudgetActive(budget) &&
      isBudgetCurrent(budget)
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
    createBudget,
    updateBudget,
    cancelBudget,
    clearFormErrors,
    formatDate,
    isBudgetActive,
    isBudgetCurrent,
    getActiveBudgetsForClient
  };
};
