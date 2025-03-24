
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
  google_account_id: string | null;
  google_ads_budget: number;
  status: string;
}

interface BudgetValues {
  formattedValue: string;  // Valor formatado para exibição do Meta Ads (R$ 1.000,00)
  accountId: string;
  rawValue: number;
  googleFormattedValue: string; // Valor formatado para exibição do Google Ads
  googleAccountId: string;
  googleRawValue: number;
}

export const useBudgetManager = () => {
  const [budgets, setBudgets] = useState<Record<string, BudgetValues>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar clientes ativos de forma otimizada
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-active-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id, meta_ads_budget, google_account_id, google_ads_budget, status")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
        throw error;
      }

      return data as Client[];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos para melhorar performance
  });

  // Calcular o total de orçamentos Meta
  const totalBudget = useMemo(() => {
    if (!budgets) return formatCurrency(0);
    
    const total = Object.values(budgets).reduce(
      (sum, budget) => sum + (budget.rawValue || 0), 
      0
    );
    
    return formatCurrency(total);
  }, [budgets]);

  // Calcular o total de orçamentos Google
  const totalGoogleBudget = useMemo(() => {
    if (!budgets) return formatCurrency(0);
    
    const total = Object.values(budgets).reduce(
      (sum, budget) => sum + (budget.googleRawValue || 0), 
      0
    );
    
    return formatCurrency(total);
  }, [budgets]);

  // Inicializar orçamentos com dados existentes
  useEffect(() => {
    if (clients?.length) {
      const initialBudgets: Record<string, BudgetValues> = {};
      
      clients.forEach((client) => {
        // Formatar os valores dos orçamentos para exibição (R$ 1.000,00)
        const formattedValue = client.meta_ads_budget 
          ? formatCurrency(client.meta_ads_budget) 
          : "";

        const googleFormattedValue = client.google_ads_budget
          ? formatCurrency(client.google_ads_budget)
          : "";
        
        initialBudgets[client.id] = {
          formattedValue,
          accountId: client.meta_account_id || "",
          rawValue: client.meta_ads_budget || 0,
          googleFormattedValue,
          googleAccountId: client.google_account_id || "",
          googleRawValue: client.google_ads_budget || 0
        };
      });
      
      setBudgets(initialBudgets);
    }
  }, [clients]);

  // Mutation para salvar orçamentos com feedback melhorado
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(budgets).map(([clientId, values]) => {
        return {
          id: clientId,
          meta_ads_budget: values.rawValue,
          meta_account_id: values.accountId || null,
          google_ads_budget: values.googleRawValue,
          google_account_id: values.googleAccountId || null
        };
      });
      
      // Realizar atualização em lote
      for (const update of updates) {
        const { error } = await supabase
          .from("clients")
          .update({
            meta_ads_budget: update.meta_ads_budget,
            meta_account_id: update.meta_account_id,
            google_ads_budget: update.google_ads_budget,
            google_account_id: update.google_account_id
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

  // Manipulador para alteração de orçamento Meta - sem limitar entrada do usuário
  const handleBudgetChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        formattedValue: value
      }
    }));
  };

  // Manipulador para alteração de orçamento Google - sem limitar entrada do usuário
  const handleGoogleBudgetChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        googleFormattedValue: value
      }
    }));
  };

  // Manipulador para formatação de valor ao perder o foco
  const handleBudgetBlur = (clientId: string, type: 'meta' | 'google') => {
    setBudgets((prev) => {
      const currentBudget = prev[clientId];
      
      if (type === 'meta') {
        const currentValue = currentBudget?.formattedValue || "";
        
        // Se o campo estiver vazio, não formatar
        if (!currentValue.trim()) {
          return {
            ...prev,
            [clientId]: {
              ...currentBudget,
              formattedValue: "",
              rawValue: 0
            }
          };
        }
        
        // Converter para número e depois formatar como moeda
        const numericValue = parseCurrencyToNumber(currentValue);
        const formattedValue = formatCurrency(numericValue);
        
        return {
          ...prev,
          [clientId]: {
            ...currentBudget,
            formattedValue,
            rawValue: numericValue
          }
        };
      } else {
        const currentValue = currentBudget?.googleFormattedValue || "";
        
        // Se o campo estiver vazio, não formatar
        if (!currentValue.trim()) {
          return {
            ...prev,
            [clientId]: {
              ...currentBudget,
              googleFormattedValue: "",
              googleRawValue: 0
            }
          };
        }
        
        // Converter para número e depois formatar como moeda
        const numericValue = parseCurrencyToNumber(currentValue);
        const formattedValue = formatCurrency(numericValue);
        
        return {
          ...prev,
          [clientId]: {
            ...currentBudget,
            googleFormattedValue: formattedValue,
            googleRawValue: numericValue
          }
        };
      }
    });
  };

  // Manipulador para alteração de ID da conta Meta
  const handleAccountIdChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        accountId: value
      },
    }));
  };

  // Manipulador para alteração de ID da conta Google
  const handleGoogleAccountIdChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        googleAccountId: value
      },
    }));
  };

  // Manipulador para salvar alterações
  const handleSave = () => {
    // Formatar todos os valores antes de salvar
    setBudgets((prev) => {
      const formatted = { ...prev };
      
      Object.keys(formatted).forEach((clientId) => {
        const currentValues = formatted[clientId];
        
        // Formatar valores do Meta Ads
        if (currentValues.formattedValue.trim()) {
          const numericValue = parseCurrencyToNumber(currentValues.formattedValue);
          formatted[clientId].formattedValue = formatCurrency(numericValue);
          formatted[clientId].rawValue = numericValue;
        }
        
        // Formatar valores do Google Ads
        if (currentValues.googleFormattedValue.trim()) {
          const numericValue = parseCurrencyToNumber(currentValues.googleFormattedValue);
          formatted[clientId].googleFormattedValue = formatCurrency(numericValue);
          formatted[clientId].googleRawValue = numericValue;
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
    handleGoogleBudgetChange,
    handleGoogleAccountIdChange,
    handleSave,
    isSaving: saveBudgetsMutation.isPending,
    totalBudget,
    totalGoogleBudget
  };
};
