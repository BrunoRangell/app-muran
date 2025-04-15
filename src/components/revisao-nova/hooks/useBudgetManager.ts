
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
  // Campos para conta secundária
  hasSecondary: boolean;
  secondaryFormattedValue: string;
  secondaryAccountId: string;
  secondaryRawValue: number;
  secondaryGoogleFormattedValue: string;
  secondaryGoogleAccountId: string;
  secondaryGoogleRawValue: number;
}

type AccountType = 'primary' | 'secondary';

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
      (sum, budget) => {
        let clientTotal = budget.rawValue || 0;
        
        // Adicionar orçamento secundário se existir
        if (budget.hasSecondary) {
          clientTotal += budget.secondaryRawValue || 0;
        }
        
        return sum + clientTotal;
      }, 
      0
    );
    
    return formatCurrency(total);
  }, [budgets]);

  // Calcular o total de orçamentos Google
  const totalGoogleBudget = useMemo(() => {
    if (!budgets) return formatCurrency(0);
    
    const total = Object.values(budgets).reduce(
      (sum, budget) => {
        let clientTotal = budget.googleRawValue || 0;
        
        // Adicionar orçamento secundário se existir
        if (budget.hasSecondary) {
          clientTotal += budget.secondaryGoogleRawValue || 0;
        }
        
        return sum + clientTotal;
      }, 
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
          googleRawValue: client.google_ads_budget || 0,
          // Inicializar campos de conta secundária
          hasSecondary: false,
          secondaryFormattedValue: "",
          secondaryAccountId: "",
          secondaryRawValue: 0,
          secondaryGoogleFormattedValue: "",
          secondaryGoogleAccountId: "",
          secondaryGoogleRawValue: 0
        };
      });
      
      setBudgets(initialBudgets);
    }
  }, [clients]);

  // Mutation para salvar orçamentos com feedback melhorado
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      // Tratar contas primárias primeiro
      const primaryUpdates = Object.entries(budgets).map(([clientId, values]) => {
        return {
          id: clientId,
          meta_ads_budget: values.rawValue,
          meta_account_id: values.accountId || null,
          google_ads_budget: values.googleRawValue,
          google_account_id: values.googleAccountId || null
        };
      });
      
      // Processar contas primárias
      for (const update of primaryUpdates) {
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
      
      // Processar contas secundárias - aqui poderíamos usar client_meta_accounts e client_google_accounts
      const secondaryUpdates = Object.entries(budgets)
        .filter(([_, values]) => values.hasSecondary)
        .map(([clientId, values]) => {
          return {
            clientId,
            metaAccount: {
              client_id: clientId,
              account_id: values.secondaryAccountId,
              account_name: "Conta secundária",
              budget_amount: values.secondaryRawValue,
              is_primary: false
            },
            googleAccount: {
              client_id: clientId,
              account_id: values.secondaryGoogleAccountId,
              account_name: "Conta secundária",
              budget_amount: values.secondaryGoogleRawValue,
              is_primary: false
            }
          };
        });
        
      // Criar ou atualizar contas secundárias
      for (const update of secondaryUpdates) {
        // Verificar se já existe conta Meta secundária
        if (update.metaAccount.account_id) {
          const { data: existingMetaAccount } = await supabase
            .from("client_meta_accounts")
            .select("id")
            .eq("client_id", update.clientId)
            .eq("is_primary", false)
            .maybeSingle();
            
          if (existingMetaAccount) {
            // Atualizar conta existente
            await supabase
              .from("client_meta_accounts")
              .update({
                account_id: update.metaAccount.account_id,
                budget_amount: update.metaAccount.budget_amount
              })
              .eq("id", existingMetaAccount.id);
          } else {
            // Criar nova conta
            await supabase
              .from("client_meta_accounts")
              .insert(update.metaAccount);
          }
        }
        
        // Verificar se já existe conta Google secundária
        if (update.googleAccount.account_id) {
          const { data: existingGoogleAccount } = await supabase
            .from("client_google_accounts")
            .select("id")
            .eq("client_id", update.clientId)
            .eq("is_primary", false)
            .maybeSingle();
            
          if (existingGoogleAccount) {
            // Atualizar conta existente
            await supabase
              .from("client_google_accounts")
              .update({
                account_id: update.googleAccount.account_id,
                budget_amount: update.googleAccount.budget_amount
              })
              .eq("id", existingGoogleAccount.id);
          } else {
            // Criar nova conta
            await supabase
              .from("client_google_accounts")
              .insert(update.googleAccount);
          }
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

  // Adicionar conta secundária para um cliente
  const addSecondaryAccount = (clientId: string) => {
    setBudgets(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        hasSecondary: true
      }
    }));
    
    toast({
      title: "Conta secundária adicionada",
      description: "Preencha os dados da conta secundária e salve as alterações.",
    });
  };

  // Manipulador para alteração de orçamento Meta - sem limitar entrada do usuário
  const handleBudgetChange = (clientId: string, value: string, accountType: AccountType = 'primary') => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        ...(accountType === 'primary' 
          ? { formattedValue: value }
          : { secondaryFormattedValue: value })
      }
    }));
  };

  // Manipulador para alteração de orçamento Google - sem limitar entrada do usuário
  const handleGoogleBudgetChange = (clientId: string, value: string, accountType: AccountType = 'primary') => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        ...(accountType === 'primary' 
          ? { googleFormattedValue: value }
          : { secondaryGoogleFormattedValue: value })
      }
    }));
  };

  // Manipulador para formatação de valor ao perder o foco
  const handleBudgetBlur = (clientId: string, type: 'meta' | 'google', accountType: AccountType = 'primary') => {
    setBudgets((prev) => {
      const currentBudget = prev[clientId];
      
      if (type === 'meta') {
        if (accountType === 'primary') {
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
          const currentValue = currentBudget?.secondaryFormattedValue || "";
          
          if (!currentValue.trim()) {
            return {
              ...prev,
              [clientId]: {
                ...currentBudget,
                secondaryFormattedValue: "",
                secondaryRawValue: 0
              }
            };
          }
          
          const numericValue = parseCurrencyToNumber(currentValue);
          const formattedValue = formatCurrency(numericValue);
          
          return {
            ...prev,
            [clientId]: {
              ...currentBudget,
              secondaryFormattedValue: formattedValue,
              secondaryRawValue: numericValue
            }
          };
        }
      } else {
        if (accountType === 'primary') {
          const currentValue = currentBudget?.googleFormattedValue || "";
          
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
        } else {
          const currentValue = currentBudget?.secondaryGoogleFormattedValue || "";
          
          if (!currentValue.trim()) {
            return {
              ...prev,
              [clientId]: {
                ...currentBudget,
                secondaryGoogleFormattedValue: "",
                secondaryGoogleRawValue: 0
              }
            };
          }
          
          const numericValue = parseCurrencyToNumber(currentValue);
          const formattedValue = formatCurrency(numericValue);
          
          return {
            ...prev,
            [clientId]: {
              ...currentBudget,
              secondaryGoogleFormattedValue: formattedValue,
              secondaryGoogleRawValue: numericValue
            }
          };
        }
      }
    });
  };

  // Manipulador para alteração de ID da conta Meta
  const handleAccountIdChange = (clientId: string, value: string, accountType: AccountType = 'primary') => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        ...(accountType === 'primary' 
          ? { accountId: value }
          : { secondaryAccountId: value })
      },
    }));
  };

  // Manipulador para alteração de ID da conta Google
  const handleGoogleAccountIdChange = (clientId: string, value: string, accountType: AccountType = 'primary') => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        ...(accountType === 'primary' 
          ? { googleAccountId: value }
          : { secondaryGoogleAccountId: value })
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
        
        // Formatar valores da conta primária
        if (currentValues.formattedValue.trim()) {
          const numericValue = parseCurrencyToNumber(currentValues.formattedValue);
          formatted[clientId].formattedValue = formatCurrency(numericValue);
          formatted[clientId].rawValue = numericValue;
        }
        
        if (currentValues.googleFormattedValue.trim()) {
          const numericValue = parseCurrencyToNumber(currentValues.googleFormattedValue);
          formatted[clientId].googleFormattedValue = formatCurrency(numericValue);
          formatted[clientId].googleRawValue = numericValue;
        }
        
        // Formatar valores da conta secundária se existir
        if (currentValues.hasSecondary) {
          if (currentValues.secondaryFormattedValue.trim()) {
            const numericValue = parseCurrencyToNumber(currentValues.secondaryFormattedValue);
            formatted[clientId].secondaryFormattedValue = formatCurrency(numericValue);
            formatted[clientId].secondaryRawValue = numericValue;
          }
          
          if (currentValues.secondaryGoogleFormattedValue.trim()) {
            const numericValue = parseCurrencyToNumber(currentValues.secondaryGoogleFormattedValue);
            formatted[clientId].secondaryGoogleFormattedValue = formatCurrency(numericValue);
            formatted[clientId].secondaryGoogleRawValue = numericValue;
          }
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
    addSecondaryAccount,
    isSaving: saveBudgetsMutation.isPending,
    totalBudget,
    totalGoogleBudget
  };
};
