
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

  // Buscar contas secundárias
  const { data: metaAccounts } = useQuery({
    queryKey: ["client-meta-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_meta_accounts")
        .select("*")
        .eq("is_primary", false);

      if (error) {
        console.error("Erro ao buscar contas Meta secundárias:", error);
        return [];
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: googleAccounts } = useQuery({
    queryKey: ["client-google-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("is_primary", false);

      if (error) {
        console.error("Erro ao buscar contas Google secundárias:", error);
        return [];
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
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
      
      // Configurar contas secundárias se existirem
      if (metaAccounts?.length || googleAccounts?.length) {
        // Agrupar contas por cliente para facilitar o processamento
        const metaAccountsByClient = metaAccounts?.reduce((acc, account) => {
          if (!acc[account.client_id]) {
            acc[account.client_id] = [];
          }
          acc[account.client_id].push(account);
          return acc;
        }, {} as Record<string, any[]>) || {};

        const googleAccountsByClient = googleAccounts?.reduce((acc, account) => {
          if (!acc[account.client_id]) {
            acc[account.client_id] = [];
          }
          acc[account.client_id].push(account);
          return acc;
        }, {} as Record<string, any[]>) || {};

        // Adicionar contas secundárias aos clientes
        Object.keys(initialBudgets).forEach(clientId => {
          const metaSecondaryAccounts = metaAccountsByClient[clientId] || [];
          const googleSecondaryAccounts = googleAccountsByClient[clientId] || [];
          
          if (metaSecondaryAccounts.length > 0 || googleSecondaryAccounts.length > 0) {
            const metaAccount = metaSecondaryAccounts[0];
            const googleAccount = googleSecondaryAccounts[0];
            
            initialBudgets[clientId].hasSecondary = true;
            
            if (metaAccount) {
              initialBudgets[clientId].secondaryAccountId = metaAccount.account_id || "";
              initialBudgets[clientId].secondaryRawValue = metaAccount.budget_amount || 0;
              initialBudgets[clientId].secondaryFormattedValue = formatCurrency(metaAccount.budget_amount || 0);
            }
            
            if (googleAccount) {
              initialBudgets[clientId].secondaryGoogleAccountId = googleAccount.account_id || "";
              initialBudgets[clientId].secondaryGoogleRawValue = googleAccount.budget_amount || 0;
              initialBudgets[clientId].secondaryGoogleFormattedValue = formatCurrency(googleAccount.budget_amount || 0);
            }
          }
        });
      }
      
      setBudgets(initialBudgets);
    }
  }, [clients, metaAccounts, googleAccounts]);

  // Mutation para salvar orçamentos com feedback melhorado
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Iniciando salvamento de orçamentos e contas...");
        
        // 1. Processar contas primárias - atualizar tabela clients
        const primaryUpdates = Object.entries(budgets).map(([clientId, values]) => {
          return {
            id: clientId,
            meta_ads_budget: values.rawValue,
            meta_account_id: values.accountId || null,
            google_ads_budget: values.googleRawValue,
            google_account_id: values.googleAccountId || null
          };
        });
        
        console.log("Atualizando contas primárias:", primaryUpdates);
        
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
        
        // 2. Processar contas Meta secundárias
        for (const [clientId, values] of Object.entries(budgets)) {
          if (values.hasSecondary && values.secondaryAccountId) {
            // Verificar se já existe conta secundária para este cliente
            console.log(`Verificando conta Meta secundária para cliente ${clientId}`);
            
            const { data: existingMetaAccounts, error: fetchError } = await supabase
              .from("client_meta_accounts")
              .select("*")
              .eq("client_id", clientId)
              .eq("is_primary", false);
            
            if (fetchError) {
              console.error(`Erro ao buscar contas Meta secundárias do cliente ${clientId}:`, fetchError);
              throw fetchError;
            }
            
            if (existingMetaAccounts && existingMetaAccounts.length > 0) {
              // Atualizar conta existente
              console.log(`Atualizando conta Meta secundária existente:`, {
                id: existingMetaAccounts[0].id,
                account_id: values.secondaryAccountId,
                budget_amount: values.secondaryRawValue
              });
              
              const { error: updateError } = await supabase
                .from("client_meta_accounts")
                .update({
                  account_id: values.secondaryAccountId,
                  account_name: "Conta secundária",
                  budget_amount: values.secondaryRawValue,
                  status: 'active'
                })
                .eq("id", existingMetaAccounts[0].id);
              
              if (updateError) {
                console.error(`Erro ao atualizar conta Meta secundária:`, updateError);
                throw updateError;
              }
            } else if (values.secondaryAccountId && values.secondaryRawValue > 0) {
              // Criar nova conta
              console.log(`Criando nova conta Meta secundária:`, {
                client_id: clientId,
                account_id: values.secondaryAccountId,
                budget_amount: values.secondaryRawValue
              });
              
              const { error: insertError } = await supabase
                .from("client_meta_accounts")
                .insert({
                  client_id: clientId,
                  account_id: values.secondaryAccountId,
                  account_name: "Conta secundária",
                  budget_amount: values.secondaryRawValue,
                  is_primary: false,
                  status: 'active'
                });
              
              if (insertError) {
                console.error(`Erro ao criar conta Meta secundária:`, insertError);
                throw insertError;
              }
            }
          }
        }
        
        // 3. Processar contas Google secundárias
        for (const [clientId, values] of Object.entries(budgets)) {
          if (values.hasSecondary && values.secondaryGoogleAccountId) {
            // Verificar se já existe conta secundária para este cliente
            console.log(`Verificando conta Google secundária para cliente ${clientId}`);
            
            const { data: existingGoogleAccounts, error: fetchError } = await supabase
              .from("client_google_accounts")
              .select("*")
              .eq("client_id", clientId)
              .eq("is_primary", false);
            
            if (fetchError) {
              console.error(`Erro ao buscar contas Google secundárias do cliente ${clientId}:`, fetchError);
              throw fetchError;
            }
            
            if (existingGoogleAccounts && existingGoogleAccounts.length > 0) {
              // Atualizar conta existente
              console.log(`Atualizando conta Google secundária existente:`, {
                id: existingGoogleAccounts[0].id,
                account_id: values.secondaryGoogleAccountId,
                budget_amount: values.secondaryGoogleRawValue
              });
              
              const { error: updateError } = await supabase
                .from("client_google_accounts")
                .update({
                  account_id: values.secondaryGoogleAccountId,
                  account_name: "Conta secundária",
                  budget_amount: values.secondaryGoogleRawValue,
                  status: 'active'
                })
                .eq("id", existingGoogleAccounts[0].id);
              
              if (updateError) {
                console.error(`Erro ao atualizar conta Google secundária:`, updateError);
                throw updateError;
              }
            } else if (values.secondaryGoogleAccountId && values.secondaryGoogleRawValue > 0) {
              // Criar nova conta
              console.log(`Criando nova conta Google secundária:`, {
                client_id: clientId,
                account_id: values.secondaryGoogleAccountId,
                budget_amount: values.secondaryGoogleRawValue
              });
              
              const { error: insertError } = await supabase
                .from("client_google_accounts")
                .insert({
                  client_id: clientId,
                  account_id: values.secondaryGoogleAccountId,
                  account_name: "Conta secundária",
                  budget_amount: values.secondaryGoogleRawValue,
                  is_primary: false,
                  status: 'active'
                });
              
              if (insertError) {
                console.error(`Erro ao criar conta Google secundária:`, insertError);
                throw insertError;
              }
            }
          }
        }
        
        console.log("Salvamento concluído com sucesso!");
        return true;
      } catch (error) {
        console.error("Erro durante o processo de salvamento:", error);
        throw error;
      }
    },
    meta: {
      onSuccess: () => {
        toast({
          title: "Orçamentos salvos",
          description: "Orçamentos e contas atualizados com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ["clients-active-budgets"] });
        queryClient.invalidateQueries({ queryKey: ["client-meta-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["client-google-accounts"] });
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
    
    // Iniciar o processo de salvamento
    console.log("Iniciando salvamento com dados:", budgets);
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
