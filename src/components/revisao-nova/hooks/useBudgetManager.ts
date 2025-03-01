
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { parseCurrencyToNumber } from "@/utils/formatters";

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
  status: string;
}

interface BudgetValues {
  budget: string;
  accountId: string;
  displayBudget: string;
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
        const budgetValue = client.meta_ads_budget ? client.meta_ads_budget.toString() : "";
        initialBudgets[client.id] = {
          budget: budgetValue,
          accountId: client.meta_account_id || "",
          displayBudget: budgetValue // Sem formatação
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
        // Converter valor do orçamento para número
        let budget = 0;
        
        if (values.budget) {
          // Substituir vírgula por ponto para conversão numérica
          const normalizedValue = values.budget.replace(",", ".");
          budget = parseFloat(normalizedValue);
          
          if (isNaN(budget)) {
            budget = 0;
          }
        }
        
        return {
          id: clientId,
          meta_ads_budget: budget,
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

  // Manipulador de orçamento sem formatação automática
  const handleBudgetChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        budget: value,
        displayBudget: value // Sem formatação, mostra exatamente o que o usuário digitou
      }
    }));
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
    saveBudgetsMutation.mutate();
  };

  return {
    clients,
    isLoading,
    budgets,
    handleBudgetChange,
    handleAccountIdChange,
    handleSave,
    isSaving: saveBudgetsMutation.isPending
  };
};
