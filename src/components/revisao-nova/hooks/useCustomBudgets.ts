
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
  platform: 'meta' | 'google';
  created_at: string;
  is_active: boolean;
  is_recurring: boolean;
  recurrence_pattern: string | null;
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
  platform: 'meta' | 'google';
  description: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

interface UseCustomBudgetsOptions {
  sortBy?: string;
  statusFilter?: string;
  platformFilter?: string;
}

export const useCustomBudgets = (options: UseCustomBudgetsOptions = {}) => {
  const { sortBy = "client_name", statusFilter = "all", platformFilter = "all" } = options;
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

  // Aplicar filtros e ordenação aos orçamentos/clientes
  const getFilteredAndSortedBudgets = () => {
    if (!customBudgets) return [];
    
    let filtered = [...customBudgets];
    
    // Aplicar filtro por plataforma
    if (platformFilter !== "all") {
      filtered = filtered.filter(budget => budget.platform === platformFilter);
    }
    
    // Aplicar filtro por status
    if (statusFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(budget => {
        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);
        
        switch (statusFilter) {
          case "active":
            return budget.is_active && startDate <= today && endDate >= today;
          case "scheduled":
            return budget.is_active && startDate > today;
          case "inactive":
            return !budget.is_active;
          case "expired":
            return budget.is_active && endDate < today;
          case "recurring":
            return budget.is_recurring;
          default:
            return true;
        }
      });
    }
    
    // Aplicar ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "client_name":
          return (a.client_name || "").localeCompare(b.client_name || "");
        case "budget_amount_desc":
          return b.budget_amount - a.budget_amount;
        case "budget_amount_asc":
          return a.budget_amount - b.budget_amount;
        case "start_date_desc":
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case "start_date_asc":
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case "end_date_desc":
          return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
        case "end_date_asc":
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        case "platform":
          return a.platform.localeCompare(b.platform);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Filtrar clientes com base no termo de pesquisa e agrupar orçamentos por cliente
  const filteredClients = clients && customBudgets ? clients.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  ).map(client => {
    const filteredBudgets = getFilteredAndSortedBudgets().filter(
      (budget: CustomBudget) => budget.client_id === client.id
    );
    
    return {
      id: client.id,
      company_name: client.company_name,
      customBudgets: filteredBudgets
    };
  }).filter(client => (statusFilter === "all" && platformFilter === "all") || client.customBudgets.length > 0) : [];

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

      const { data, error } = await supabase
        .from("custom_budgets")
        .insert({
          client_id: formData.clientId,
          budget_amount: formData.budgetAmount,
          start_date: formData.startDate,
          end_date: formData.endDate,
          platform: formData.platform,
          description: formData.description || null,
          is_active: true,
          is_recurring: formData.isRecurring || false,
          recurrence_pattern: formData.recurrencePattern || null
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
        .from("custom_budgets")
        .update({
          budget_amount: formData.budgetAmount,
          start_date: formData.startDate,
          end_date: formData.endDate,
          platform: formData.platform,
          description: formData.description || null,
          is_recurring: formData.isRecurring || false,
          recurrence_pattern: formData.recurrencePattern || null
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

  // Duplicar orçamento existente
  const duplicateBudgetMutation = useMutation({
    mutationFn: async (budget: CustomBudget) => {
      const { data, error } = await supabase
        .from("custom_budgets")
        .insert({
          client_id: budget.client_id,
          budget_amount: budget.budget_amount,
          start_date: budget.start_date,
          end_date: budget.end_date,
          platform: budget.platform,
          description: budget.description ? `${budget.description} (cópia)` : '(cópia)',
          is_active: true,
          is_recurring: budget.is_recurring,
          recurrence_pattern: budget.recurrence_pattern
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao duplicar orçamento personalizado:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-budgets"] });
      toast({
        title: "Orçamento duplicado",
        description: "O orçamento foi duplicado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao duplicar orçamento",
        description: "Não foi possível duplicar o orçamento personalizado.",
        variant: "destructive",
      });
    },
  });

  // Excluir orçamento personalizado
  const deleteCustomBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("custom_budgets")
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
        .from("custom_budgets")
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

    if (!formData.platform) {
      errors.platform = "Selecione uma plataforma";
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

    // Validar padrão de recorrência
    if (formData.isRecurring && !formData.recurrencePattern) {
      errors.recurrencePattern = "Selecione um padrão de recorrência";
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

  // Exportar para CSV
  const exportToCSV = () => {
    if (!customBudgets || customBudgets.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há orçamentos personalizados para exportar.",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar dados para exportação
    const csvData = getFilteredAndSortedBudgets().map(budget => {
      const client = clients?.find(c => c.id === budget.client_id);
      return {
        cliente: client?.company_name || budget.client_id,
        plataforma: budget.platform === 'meta' ? 'Meta Ads' : 'Google Ads',
        valor: budget.budget_amount,
        data_inicio: formatDate(budget.start_date),
        data_fim: formatDate(budget.end_date),
        status: budget.is_active ? "Ativo" : "Inativo",
        recorrente: budget.is_recurring ? "Sim" : "Não",
        padrao_recorrencia: budget.recurrence_pattern || "N/A",
        descricao: budget.description || ""
      };
    });
    
    // Criar cabeçalhos
    const headers = [
      "Cliente", "Plataforma", "Valor (R$)", "Data Início", 
      "Data Fim", "Status", "Recorrente", "Padrão de Recorrência", "Descrição"
    ];
    
    // Converter para formato CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => [
        `"${row.cliente}"`, 
        `"${row.plataforma}"`,
        row.valor, 
        `"${row.data_inicio}"`, 
        `"${row.data_fim}"`,
        `"${row.status}"`,
        `"${row.recorrente}"`,
        `"${row.padrao_recorrencia}"`,
        `"${row.descricao}"`
      ].join(','))
    ].join('\n');
    
    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orcamentos-personalizados-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação concluída",
      description: "Os dados foram exportados com sucesso.",
    });
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
  const getActiveBudgetsForClient = (clientId: string, platform?: 'meta' | 'google') => {
    if (!customBudgets) return [];
    
    return customBudgets.filter((budget: CustomBudget) => 
      budget.client_id === clientId && 
      budget.is_active &&
      isCurrentlyActive(budget) &&
      (platform ? budget.platform === platform : true)
    );
  };

  // Função para formatar data com o formato usado na interface
  const format = (date: Date, formatStr: string) => {
    // Implementação simples para o formato usado na função exportToCSV
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obter estatísticas de orçamentos
  const getBudgetStats = () => {
    if (!customBudgets) {
      return {
        total: 0,
        active: 0,
        scheduled: 0,
        expired: 0,
        meta: 0, 
        google: 0
      };
    }

    const stats = {
      total: customBudgets.length,
      active: 0,
      scheduled: 0,
      expired: 0,
      meta: 0,
      google: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    customBudgets.forEach(budget => {
      // Contar por plataforma
      if (budget.platform === 'meta') stats.meta++;
      else if (budget.platform === 'google') stats.google++;

      // Contar por status
      if (!budget.is_active) return;

      const startDate = new Date(budget.start_date);
      const endDate = new Date(budget.end_date);

      if (startDate <= today && endDate >= today) {
        stats.active++;
      } else if (startDate > today) {
        stats.scheduled++;
      } else if (endDate < today) {
        stats.expired++;
      }
    });

    return stats;
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
    exportToCSV,
    getBudgetStats,
    // Adicionando as mutações necessárias
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation,
    duplicateBudgetMutation
  };
};
