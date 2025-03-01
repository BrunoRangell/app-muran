
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
  status: string;
}

interface BudgetValues {
  formattedValue: string;  // Valor formatado para exibição (R$ 1.000,00)
  accountId: string;
}

export const useBudgetManager = () => {
  const [budgets, setBudgets] = useState<Record<string, BudgetValues>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar clientes ativos
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-active-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id, meta_ads_budget, status")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      return data as Client[];
    },
  });

  // Inicializar orçamentos com dados existentes
  useEffect(() => {
    if (clients?.length) {
      const initialBudgets: Record<string, BudgetValues> = {};
      
      clients.forEach((client) => {
        // Formatar o valor do orçamento para exibição (R$ 1.000,00)
        const formattedValue = client.meta_ads_budget 
          ? formatCurrency(client.meta_ads_budget) 
          : "";
        
        initialBudgets[client.id] = {
          formattedValue,
          accountId: client.meta_account_id || ""
        };
      });
      
      setBudgets(initialBudgets);
    }
  }, [clients]);

  // Mutation para salvar orçamentos
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      console.log("Salvando orçamentos:", budgets);
      
      const updates = Object.entries(budgets).map(([clientId, values]) => {
        // Converter valor formatado para número
        const budgetAmount = parseCurrencyToNumber(values.formattedValue);
        
        return {
          id: clientId,
          meta_ads_budget: budgetAmount,
          meta_account_id: values.accountId || null
        };
      });
      
      // Realizar atualização em lote
      for (const update of updates) {
        const { error } = await supabase
          .from("clients")
          .update({
            meta_ads_budget: update.meta_ads_budget,
            meta_account_id: update.meta_account_id
          })
          .eq("id", update.id);

        if (error) {
          console.error(`Erro ao atualizar cliente ${update.id}:`, error);
          throw error;
        }
      }
      
      return true;
    },
    meta: {
      onSuccess: () => {
        toast({
          title: "Orçamentos salvos",
          description: "Orçamentos e contas atualizados com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ["clients-active-budgets"] });
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao salvar",
          description: error.message || "Ocorreu um erro ao salvar os orçamentos.",
          variant: "destructive",
        });
      }
    }
  });

  // Manipulador para alteração de orçamento
  const handleBudgetChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        formattedValue: value
      }
    }));
  };

  // Manipulador para formatação de valor ao perder o foco
  const handleBudgetBlur = (clientId: string) => {
    setBudgets((prev) => {
      const currentValue = prev[clientId]?.formattedValue || "";
      
      // Se o campo estiver vazio, não formatar
      if (!currentValue.trim()) {
        return {
          ...prev,
          [clientId]: {
            ...prev[clientId],
            formattedValue: ""
          }
        };
      }
      
      // Converter para número e depois formatar como moeda
      const numericValue = parseCurrencyToNumber(currentValue);
      const formattedValue = formatCurrency(numericValue);
      
      return {
        ...prev,
        [clientId]: {
          ...prev[clientId],
          formattedValue
        }
      };
    });
  };

  // Manipulador para alteração de ID da conta
  const handleAccountIdChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        accountId: value
      },
    }));
  };

  // Manipulador para salvar alterações
  const handleSave = () => {
    // Formatar todos os valores antes de salvar
    setBudgets((prev) => {
      const formatted = { ...prev };
      
      Object.keys(formatted).forEach((clientId) => {
        const currentValue = formatted[clientId].formattedValue;
        if (currentValue.trim()) {
          const numericValue = parseCurrencyToNumber(currentValue);
          formatted[clientId].formattedValue = formatCurrency(numericValue);
        }
      });
      
      return formatted;
    });
    
    saveBudgetsMutation.mutate();
  };

  return {
    clients,
    isLoading,
    budgets,
    handleBudgetChange,
    handleBudgetBlur,
    handleAccountIdChange,
    handleSave,
    isSaving: saveBudgetsMutation.isPending
  };
};
