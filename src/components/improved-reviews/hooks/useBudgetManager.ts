import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

interface Client {
  id: string;
  company_name: string;
  status: string;
}

interface ClientAccount {
  id: string;
  client_id: string;
  platform: 'meta' | 'google';
  account_id: string;
  account_name: string;
  is_primary: boolean;
  budget_amount: number;
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

  // Buscar clientes ativos
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients-active-budgets"],
    queryFn: async () => {
      console.log("🔍 Buscando clientes ativos...");
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, status")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      console.log(`✅ Encontrados ${data?.length || 0} clientes ativos:`, data);
      return data as Client[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar todas as contas dos clientes da nova estrutura unificada
  const { data: clientAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["client-accounts-unified"],
    queryFn: async () => {
      console.log("🔍 Buscando contas dos clientes...");
      const { data, error } = await supabase
        .from("client_accounts")
        .select("*")
        .eq("status", "active")
        .order("client_id, platform, is_primary DESC");

      if (error) {
        console.error("Erro ao buscar contas dos clientes:", error);
        return [];
      }
      
      console.log(`✅ Encontradas ${data?.length || 0} contas ativas:`, data);
      return data as ClientAccount[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingClients || isLoadingAccounts;

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

  // Inicializar orçamentos com dados das contas existentes
  useEffect(() => {
    // Corrigir a condição para garantir execução adequada
    if (clients && clients.length > 0 && clientAccounts !== null && clientAccounts !== undefined) {
      console.log("🚀 Inicializando orçamentos...");
      console.log("Clientes disponíveis:", clients.length);
      console.log("Contas disponíveis:", clientAccounts.length);
      
      const initialBudgets: Record<string, BudgetValues> = {};
      
      clients.forEach((client) => {
        console.log(`📋 Processando cliente: ${client.company_name} (ID: ${client.id})`);
        
        // Buscar contas Meta para este cliente
        const metaAccounts = clientAccounts.filter(acc => 
          acc.client_id === client.id && acc.platform === 'meta'
        );
        
        // Buscar contas Google para este cliente
        const googleAccounts = clientAccounts.filter(acc => 
          acc.client_id === client.id && acc.platform === 'google'
        );
        
        console.log(`  - Contas Meta encontradas: ${metaAccounts.length}`, metaAccounts);
        console.log(`  - Contas Google encontradas: ${googleAccounts.length}`, googleAccounts);
        
        // Conta Meta primária
        const primaryMetaAccount = metaAccounts.find(acc => acc.is_primary) || metaAccounts[0];
        
        // Conta Google primária
        const primaryGoogleAccount = googleAccounts.find(acc => acc.is_primary) || googleAccounts[0];
        
        // Contas secundárias
        const secondaryMetaAccount = metaAccounts.find(acc => !acc.is_primary);
        const secondaryGoogleAccount = googleAccounts.find(acc => !acc.is_primary);
        
        const budgetData = {
          // Conta Meta primária
          formattedValue: primaryMetaAccount?.budget_amount 
            ? formatCurrency(primaryMetaAccount.budget_amount) 
            : "",
          accountId: primaryMetaAccount?.account_id || "",
          rawValue: primaryMetaAccount?.budget_amount || 0,
          
          // Conta Google primária
          googleFormattedValue: primaryGoogleAccount?.budget_amount
            ? formatCurrency(primaryGoogleAccount.budget_amount)
            : "",
          googleAccountId: primaryGoogleAccount?.account_id || "",
          googleRawValue: primaryGoogleAccount?.budget_amount || 0,
          
          // Contas secundárias
          hasSecondary: !!(secondaryMetaAccount || secondaryGoogleAccount),
          secondaryFormattedValue: secondaryMetaAccount?.budget_amount 
            ? formatCurrency(secondaryMetaAccount.budget_amount) 
            : "",
          secondaryAccountId: secondaryMetaAccount?.account_id || "",
          secondaryRawValue: secondaryMetaAccount?.budget_amount || 0,
          secondaryGoogleFormattedValue: secondaryGoogleAccount?.budget_amount 
            ? formatCurrency(secondaryGoogleAccount.budget_amount) 
            : "",
          secondaryGoogleAccountId: secondaryGoogleAccount?.account_id || "",
          secondaryGoogleRawValue: secondaryGoogleAccount?.budget_amount || 0
        };
        
        initialBudgets[client.id] = budgetData;
        
        console.log(`  ✅ Orçamento configurado para ${client.company_name}:`, budgetData);
      });
      
      setBudgets(initialBudgets);
      console.log("🎉 Inicialização de orçamentos concluída:", initialBudgets);
    } else {
      console.log("⏳ Aguardando dados...", {
        clientsLength: clients?.length || 0,
        clientAccountsNull: clientAccounts === null,
        clientAccountsUndefined: clientAccounts === undefined,
        clientAccountsLength: clientAccounts?.length || 0
      });
    }
  }, [clients, clientAccounts]);

  // Mutation para salvar orçamentos
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("💾 Iniciando salvamento de orçamentos na nova estrutura...");
        
        for (const [clientId, values] of Object.entries(budgets)) {
          console.log(`📝 Processando cliente ${clientId}:`, values);
          
          // 1. Processar conta Meta primária
          if (values.accountId || values.rawValue > 0) {
            await upsertClientAccount(clientId, 'meta', {
              account_id: values.accountId,
              budget_amount: values.rawValue,
              is_primary: true
            });
          }
          
          // 2. Processar conta Google primária
          if (values.googleAccountId || values.googleRawValue > 0) {
            await upsertClientAccount(clientId, 'google', {
              account_id: values.googleAccountId,
              budget_amount: values.googleRawValue,
              is_primary: true
            });
          }
          
          // 3. Processar conta Meta secundária
          if (values.hasSecondary) {
            if (values.secondaryAccountId || values.secondaryRawValue > 0) {
              await upsertClientAccount(clientId, 'meta', {
                account_id: values.secondaryAccountId,
                budget_amount: values.secondaryRawValue,
                is_primary: false
              });
            }
            
            // 4. Processar conta Google secundária
            if (values.secondaryGoogleAccountId || values.secondaryGoogleRawValue > 0) {
              await upsertClientAccount(clientId, 'google', {
                account_id: values.secondaryGoogleAccountId,
                budget_amount: values.secondaryGoogleRawValue,
                is_primary: false
              });
            }
          }
        }
        
        console.log("✅ Salvamento concluído com sucesso!");
        return true;
      } catch (error) {
        console.error("❌ Erro durante o processo de salvamento:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Orçamentos salvos",
        description: "Orçamentos e contas atualizados com sucesso.",
      });
      // Invalidar ambas as queries para forçar recarregamento
      queryClient.invalidateQueries({ queryKey: ["clients-active-budgets"] });
      queryClient.invalidateQueries({ queryKey: ["client-accounts-unified"] });
      console.log("🔄 Cache invalidado - dados serão recarregados");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar os orçamentos.",
        variant: "destructive",
      });
    }
  });

  // Função auxiliar para inserir/atualizar conta
  const upsertClientAccount = async (
    clientId: string, 
    platform: 'meta' | 'google', 
    accountData: {
      account_id: string;
      budget_amount: number;
      is_primary: boolean;
    }
  ) => {
    // Verificar se já existe uma conta para este cliente/plataforma/tipo
    const { data: existingAccounts, error: fetchError } = await supabase
      .from("client_accounts")
      .select("*")
      .eq("client_id", clientId)
      .eq("platform", platform)
      .eq("is_primary", accountData.is_primary);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (existingAccounts && existingAccounts.length > 0) {
      // Atualizar conta existente
      const { error: updateError } = await supabase
        .from("client_accounts")
        .update({
          account_id: accountData.account_id,
          account_name: accountData.is_primary ? "Conta principal" : "Conta secundária",
          budget_amount: accountData.budget_amount,
          status: 'active'
        })
        .eq("id", existingAccounts[0].id);
      
      if (updateError) {
        throw updateError;
      }
    } else if (accountData.account_id || accountData.budget_amount > 0) {
      // Criar nova conta se tiver account_id OU budget_amount > 0
      const { error: insertError } = await supabase
        .from("client_accounts")
        .insert({
          client_id: clientId,
          platform,
          account_id: accountData.account_id || '',
          account_name: accountData.is_primary ? "Conta principal" : "Conta secundária",
          budget_amount: accountData.budget_amount,
          is_primary: accountData.is_primary,
          status: 'active'
        });
      
      if (insertError) {
        throw insertError;
      }
    }
  };

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

  // Remover conta secundária
  const removeSecondaryAccount = async (clientId: string) => {
    try {
      console.log(`🗑️ Removendo conta secundária para cliente ${clientId}`);
      
      // Remover contas secundárias do banco de dados
      const { error: deleteError } = await supabase
        .from("client_accounts")
        .delete()
        .eq("client_id", clientId)
        .eq("is_primary", false);
      
      if (deleteError) {
        console.error("Erro ao remover contas secundárias:", deleteError);
        throw deleteError;
      }
      
      // Remover do estado local
      setBudgets(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          hasSecondary: false,
          secondaryFormattedValue: "",
          secondaryAccountId: "",
          secondaryRawValue: 0,
          secondaryGoogleFormattedValue: "",
          secondaryGoogleAccountId: "",
          secondaryGoogleRawValue: 0
        }
      }));
      
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ["client-accounts-unified"] });
      
      toast({
        title: "Conta secundária removida",
        description: "A conta secundária foi removida com sucesso.",
      });
      
    } catch (error) {
      console.error("Erro ao remover conta secundária:", error);
      toast({
        title: "Erro ao remover conta",
        description: "Não foi possível remover a conta secundária.",
        variant: "destructive",
      });
    }
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
      
      if (!currentBudget) return prev;
      
      if (type === 'meta') {
        if (accountType === 'primary') {
          const currentValue = currentBudget?.formattedValue || "";
          
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
        
        if (!currentValues) return;
        
        // Formatar valores da conta primária
        if (currentValues.formattedValue && currentValues.formattedValue.trim()) {
          const numericValue = parseCurrencyToNumber(currentValues.formattedValue);
          formatted[clientId].formattedValue = formatCurrency(numericValue);
          formatted[clientId].rawValue = numericValue;
        }
        
        if (currentValues.googleFormattedValue && currentValues.googleFormattedValue.trim()) {
          const numericValue = parseCurrencyToNumber(currentValues.googleFormattedValue);
          formatted[clientId].googleFormattedValue = formatCurrency(numericValue);
          formatted[clientId].googleRawValue = numericValue;
        }
        
        // Formatar valores da conta secundária se existir
        if (currentValues.hasSecondary) {
          if (currentValues.secondaryFormattedValue && currentValues.secondaryFormattedValue.trim()) {
            const numericValue = parseCurrencyToNumber(currentValues.secondaryFormattedValue);
            formatted[clientId].secondaryFormattedValue = formatCurrency(numericValue);
            formatted[clientId].secondaryRawValue = numericValue;
          }
          
          if (currentValues.secondaryGoogleFormattedValue && currentValues.secondaryGoogleFormattedValue.trim()) {
            const numericValue = parseCurrencyToNumber(currentValues.secondaryGoogleFormattedValue);
            formatted[clientId].secondaryGoogleFormattedValue = formatCurrency(numericValue);
            formatted[clientId].secondaryGoogleRawValue = numericValue;
          }
        }
      });
      
      return formatted;
    });
    
    // Iniciar o processo de salvamento
    console.log("💾 Iniciando salvamento com dados:", budgets);
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
    removeSecondaryAccount,
    isSaving: saveBudgetsMutation.isPending,
    totalBudget,
    totalGoogleBudget
  };
};
