import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface CustomBudgetFormData {
  clientId: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  description: string;
  platform: "meta" | "google";
}

export function useCustomBudgets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar clientes com orçamentos personalizados usando a tabela UNIFICADA
  const { data: filteredClients, isLoading } = useQuery({
    queryKey: ["clients-with-custom-budgets", searchTerm],
    queryFn: async () => {
      console.log("🔍 Buscando clientes com orçamentos personalizados...");
      
      // Buscar todos os clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          status,
          meta_ads_budget,
          google_ads_budget
        `)
        .eq("status", "active")
        .ilike("company_name", `%${searchTerm}%`)
        .order("company_name");

      if (clientsError) {
        console.error("❌ Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Buscar todos os orçamentos personalizados da tabela UNIFICADA
      const { data: customBudgets, error: budgetsError } = await supabase
        .from("custom_budgets")
        .select("*")
        .order("created_at", { ascending: false });

      if (budgetsError) {
        console.error("❌ Erro ao buscar orçamentos personalizados:", budgetsError);
        throw budgetsError;
      }

      console.log(`✅ ${clients?.length || 0} clientes e ${customBudgets?.length || 0} orçamentos encontrados`);

      // Organizar orçamentos por cliente
      const budgetsByClient = new Map();
      customBudgets?.forEach(budget => {
        if (!budgetsByClient.has(budget.client_id)) {
          budgetsByClient.set(budget.client_id, []);
        }
        budgetsByClient.get(budget.client_id).push(budget);
      });

      // Combinar dados dos clientes com seus orçamentos - CORRIGIDO
      const clientsWithBudgets = clients?.map(client => {
        const clientBudgets = budgetsByClient.get(client.id) || [];
        const metaBudgets = clientBudgets.filter(b => b.platform === 'meta');
        const googleBudgets = clientBudgets.filter(b => b.platform === 'google');

        return {
          ...client,
          metaBudgets,
          googleBudgets,
          custom_budgets: clientBudgets // Esta é a propriedade que a tabela espera
        };
      }) || [];

      // Filtrar apenas clientes que têm orçamentos personalizados
      const clientsWithAnyBudgets = clientsWithBudgets.filter(client => 
        client.custom_budgets && client.custom_budgets.length > 0
      );

      console.log(`🔍 Debug: ${clientsWithAnyBudgets.length} clientes com orçamentos personalizados encontrados`);
      clientsWithAnyBudgets.forEach(client => {
        console.log(`   - ${client.company_name}: ${client.custom_budgets.length} orçamentos`);
      });

      return clientsWithAnyBudgets;
    }
  });

  // Mutation para adicionar orçamento personalizado
  const addCustomBudgetMutation = useMutation({
    mutationFn: async (budgetData: CustomBudgetFormData) => {
      console.log("➕ Adicionando orçamento personalizado:", budgetData);
      
      const { data, error } = await supabase
        .from("custom_budgets")
        .insert({
          client_id: budgetData.clientId,
          platform: budgetData.platform,
          budget_amount: budgetData.budgetAmount,
          start_date: budgetData.startDate,
          end_date: budgetData.endDate,
          description: budgetData.description,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao adicionar orçamento:", error);
        throw error;
      }

      console.log("✅ Orçamento adicionado:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento adicionado",
        description: "O orçamento personalizado foi criado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["clients-with-custom-budgets"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao adicionar orçamento:", error);
      toast({
        title: "Erro ao adicionar orçamento",
        description: "Não foi possível criar o orçamento personalizado.",
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar orçamento personalizado
  const updateCustomBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: CustomBudgetFormData & { id: string }) => {
      console.log("📝 Atualizando orçamento personalizado:", { id, ...budgetData });
      
      const { data, error } = await supabase
        .from("custom_budgets")
        .update({
          client_id: budgetData.clientId,
          platform: budgetData.platform,
          budget_amount: budgetData.budgetAmount,
          start_date: budgetData.startDate,
          end_date: budgetData.endDate,
          description: budgetData.description,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao atualizar orçamento:", error);
        throw error;
      }

      console.log("✅ Orçamento atualizado:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento personalizado foi atualizado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["clients-with-custom-budgets"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao atualizar orçamento:", error);
      toast({
        title: "Erro ao atualizar orçamento",
        description: "Não foi possível atualizar o orçamento personalizado.",
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar orçamento personalizado
  const deleteCustomBudgetMutation = useMutation({
    mutationFn: async (budgetInfo: { id: string; platform: string }) => {
      console.log("🗑️ Deletando orçamento personalizado:", budgetInfo);
      
      const { error } = await supabase
        .from("custom_budgets")
        .delete()
        .eq("id", budgetInfo.id);

      if (error) {
        console.error("❌ Erro ao deletar orçamento:", error);
        throw error;
      }

      console.log("✅ Orçamento deletado");
    },
    onSuccess: () => {
      toast({
        title: "Orçamento removido",
        description: "O orçamento personalizado foi removido com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["clients-with-custom-budgets"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao deletar orçamento:", error);
      toast({
        title: "Erro ao remover orçamento",
        description: "Não foi possível remover o orçamento personalizado.",
        variant: "destructive"
      });
    }
  });

  // Mutation para alternar status do orçamento
  const toggleBudgetStatusMutation = useMutation({
    mutationFn: async ({ id, isActive, platform }: { id: string; isActive: boolean; platform: string }) => {
      console.log("🔄 Alternando status do orçamento:", { id, isActive, platform });
      
      const { data, error } = await supabase
        .from("custom_budgets")
        .update({ 
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao alternar status:", error);
        throw error;
      }

      console.log("✅ Status do orçamento alterado:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do orçamento personalizado foi atualizado."
      });
      queryClient.invalidateQueries({ queryKey: ["clients-with-custom-budgets"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao alternar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do orçamento.",
        variant: "destructive"
      });
    }
  });

  // Funções auxiliares
  const formatBudget = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const isCurrentlyActive = (budget: any) => {
    const today = new Date().toISOString().split('T')[0];
    return budget.is_active && 
           budget.start_date <= today && 
           budget.end_date >= today;
  };

  const isFutureBudget = (budget: any) => {
    const today = new Date().toISOString().split('T')[0];
    return budget.start_date > today;
  };

  return {
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
    formatBudget,
    isCurrentlyActive,
    isFutureBudget
  };
}
