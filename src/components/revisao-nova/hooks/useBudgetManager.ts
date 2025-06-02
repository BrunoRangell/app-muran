import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface BudgetState {
  // Meta Ads - Conta Principal (clients table)
  formattedValue: string;
  rawValue: number;
  accountId: string;
  
  // Meta Ads - Conta Secundária
  hasSecondary: boolean;
  secondaryFormattedValue: string;
  secondaryRawValue: number;
  secondaryAccountId: string;
  
  // Google Ads - Conta Principal (clients table)
  googleFormattedValue: string;
  googleRawValue: number;
  googleAccountId: string;
  
  // Google Ads - Conta Secundária
  secondaryGoogleFormattedValue: string;
  secondaryGoogleRawValue: number;
  secondaryGoogleAccountId: string;
}

export function useBudgetManager() {
  const [budgets, setBudgets] = useState<Record<string, BudgetState>>({});
  const [totalBudget, setTotalBudget] = useState("R$ 0,00");
  const [totalGoogleBudget, setTotalGoogleBudget] = useState("R$ 0,00");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados dos clientes - FONTE ÚNICA: tabela clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ["budget-manager-clients"],
    queryFn: async () => {
      console.log("🔍 Buscando dados dos clientes para gerenciamento de orçamentos...");
      
      // Buscar clientes ativos com orçamentos da FONTE ÚNICA
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          status,
          meta_ads_budget,
          meta_account_id,
          google_ads_budget,
          google_account_id
        `)
        .eq("status", "active")
        .order("company_name");

      if (clientsError) {
        console.error("❌ Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Buscar contas secundárias
      const { data: metaAccounts, error: metaError } = await supabase
        .from("client_meta_accounts")
        .select("*")
        .eq("status", "active")
        .eq("is_primary", false);

      const { data: googleAccounts, error: googleError } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("status", "active")
        .eq("is_primary", false);

      if (metaError) {
        console.error("❌ Erro ao buscar contas Meta secundárias:", metaError);
        throw metaError;
      }

      if (googleError) {
        console.error("❌ Erro ao buscar contas Google secundárias:", googleError);
        throw googleError;
      }

      console.log(`✅ Clientes: ${clientsData?.length || 0}, Meta secundárias: ${metaAccounts?.length || 0}, Google secundárias: ${googleAccounts?.length || 0}`);

      // Mapear contas secundárias por cliente
      const metaAccountsByClient = new Map();
      const googleAccountsByClient = new Map();

      metaAccounts?.forEach(account => {
        if (!metaAccountsByClient.has(account.client_id)) {
          metaAccountsByClient.set(account.client_id, []);
        }
        metaAccountsByClient.get(account.client_id).push(account);
      });

      googleAccounts?.forEach(account => {
        if (!googleAccountsByClient.has(account.client_id)) {
          googleAccountsByClient.set(account.client_id, []);
        }
        googleAccountsByClient.get(account.client_id).push(account);
      });

      // Combinar dados
      const enrichedClients = clientsData?.map(client => ({
        ...client,
        secondaryMetaAccounts: metaAccountsByClient.get(client.id) || [],
        secondaryGoogleAccounts: googleAccountsByClient.get(client.id) || []
      })) || [];

      return enrichedClients;
    }
  });

  // Inicializar estado dos orçamentos quando os dados chegarem
  useEffect(() => {
    if (clients && clients.length > 0) {
      const initialBudgets: Record<string, BudgetState> = {};
      
      clients.forEach(client => {
        // Obter primeira conta secundária se existir
        const firstSecondaryMeta = client.secondaryMetaAccounts?.[0];
        const firstSecondaryGoogle = client.secondaryGoogleAccounts?.[0];
        
        initialBudgets[client.id] = {
          // Meta Principal (da tabela clients)
          formattedValue: formatCurrency(client.meta_ads_budget || 0),
          rawValue: client.meta_ads_budget || 0,
          accountId: client.meta_account_id || "",
          
          // Meta Secundária
          hasSecondary: !!firstSecondaryMeta,
          secondaryFormattedValue: formatCurrency(firstSecondaryMeta?.budget_amount || 0),
          secondaryRawValue: firstSecondaryMeta?.budget_amount || 0,
          secondaryAccountId: firstSecondaryMeta?.account_id || "",
          
          // Google Principal (da tabela clients)
          googleFormattedValue: formatCurrency(client.google_ads_budget || 0),
          googleRawValue: client.google_ads_budget || 0,
          googleAccountId: client.google_account_id || "",
          
          // Google Secundária
          secondaryGoogleFormattedValue: formatCurrency(firstSecondaryGoogle?.budget_amount || 0),
          secondaryGoogleRawValue: firstSecondaryGoogle?.budget_amount || 0,
          secondaryGoogleAccountId: firstSecondaryGoogle?.account_id || ""
        };
      });
      
      setBudgets(initialBudgets);
      calculateTotals(initialBudgets);
    }
  }, [clients]);

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  // Função para calcular totais
  const calculateTotals = (currentBudgets: Record<string, BudgetState>) => {
    let metaTotal = 0;
    let googleTotal = 0;
    
    Object.values(currentBudgets).forEach(budget => {
      metaTotal += budget.rawValue + (budget.hasSecondary ? budget.secondaryRawValue : 0);
      googleTotal += budget.googleRawValue + budget.secondaryGoogleRawValue;
    });
    
    setTotalBudget(formatCurrency(metaTotal));
    setTotalGoogleBudget(formatCurrency(googleTotal));
  };

  // Mutation para salvar alterações
  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log("💾 Salvando alterações de orçamentos...");
      
      const clientUpdates = [];
      const metaAccountUpdates = [];
      const googleAccountUpdates = [];
      
      // Preparar atualizações para a tabela clients (FONTE ÚNICA)
      Object.entries(budgets).forEach(([clientId, budget]) => {
        const client = clients?.find(c => c.id === clientId);
        if (!client) return;
        
        // Verificar se houve mudanças nos orçamentos principais
        const metaBudgetChanged = budget.rawValue !== (client.meta_ads_budget || 0);
        const googleBudgetChanged = budget.googleRawValue !== (client.google_ads_budget || 0);
        const metaAccountChanged = budget.accountId !== (client.meta_account_id || "");
        const googleAccountChanged = budget.googleAccountId !== (client.google_account_id || "");
        
        if (metaBudgetChanged || googleBudgetChanged || metaAccountChanged || googleAccountChanged) {
          clientUpdates.push({
            id: clientId,
            meta_ads_budget: budget.rawValue,
            meta_account_id: budget.accountId || null,
            google_ads_budget: budget.googleRawValue,
            google_account_id: budget.googleAccountId || null
          });
        }
        
        // Verificar contas secundárias
        if (budget.hasSecondary) {
          const existingSecondaryMeta = client.secondaryMetaAccounts?.[0];
          if (existingSecondaryMeta) {
            // Atualizar conta secundária existente
            if (budget.secondaryRawValue !== existingSecondaryMeta.budget_amount ||
                budget.secondaryAccountId !== existingSecondaryMeta.account_id) {
              metaAccountUpdates.push({
                id: existingSecondaryMeta.id,
                budget_amount: budget.secondaryRawValue,
                account_id: budget.secondaryAccountId
              });
            }
          } else if (budget.secondaryAccountId) {
            // Criar nova conta secundária
            metaAccountUpdates.push({
              client_id: clientId,
              account_id: budget.secondaryAccountId,
              account_name: `Conta Secundária ${budget.secondaryAccountId}`,
              budget_amount: budget.secondaryRawValue,
              is_primary: false,
              status: "active"
            });
          }
        }
        
        // Mesmo processo para Google secundário
        const existingSecondaryGoogle = client.secondaryGoogleAccounts?.[0];
        if (budget.secondaryGoogleAccountId && budget.secondaryGoogleRawValue > 0) {
          if (existingSecondaryGoogle) {
            if (budget.secondaryGoogleRawValue !== existingSecondaryGoogle.budget_amount ||
                budget.secondaryGoogleAccountId !== existingSecondaryGoogle.account_id) {
              googleAccountUpdates.push({
                id: existingSecondaryGoogle.id,
                budget_amount: budget.secondaryGoogleRawValue,
                account_id: budget.secondaryGoogleAccountId
              });
            }
          } else {
            googleAccountUpdates.push({
              client_id: clientId,
              account_id: budget.secondaryGoogleAccountId,
              account_name: `Conta Secundária ${budget.secondaryGoogleAccountId}`,
              budget_amount: budget.secondaryGoogleRawValue,
              is_primary: false,
              status: "active"
            });
          }
        }
      });
      
      // Executar atualizações
      console.log(`📊 Atualizações: ${clientUpdates.length} clientes, ${metaAccountUpdates.length} Meta, ${googleAccountUpdates.length} Google`);
      
      // Atualizar tabela clients (FONTE ÚNICA)
      for (const update of clientUpdates) {
        const { id, ...updateData } = update;
        const { error } = await supabase
          .from("clients")
          .update(updateData)
          .eq("id", id);
          
        if (error) {
          console.error(`❌ Erro ao atualizar cliente ${id}:`, error);
          throw error;
        }
      }
      
      // Atualizar/inserir contas Meta secundárias
      for (const update of metaAccountUpdates) {
        if (update.id) {
          // Atualizar existente
          const { id, ...updateData } = update;
          const { error } = await supabase
            .from("client_meta_accounts")
            .update(updateData)
            .eq("id", id);
            
          if (error) {
            console.error(`❌ Erro ao atualizar conta Meta ${id}:`, error);
            throw error;
          }
        } else {
          // Inserir nova
          const { error } = await supabase
            .from("client_meta_accounts")
            .insert(update);
            
          if (error) {
            console.error("❌ Erro ao inserir conta Meta:", error);
            throw error;
          }
        }
      }
      
      // Atualizar/inserir contas Google secundárias
      for (const update of googleAccountUpdates) {
        if (update.id) {
          // Atualizar existente
          const { id, ...updateData } = update;
          const { error } = await supabase
            .from("client_google_accounts")
            .update(updateData)
            .eq("id", id);
            
          if (error) {
            console.error(`❌ Erro ao atualizar conta Google ${id}:`, error);
            throw error;
          }
        } else {
          // Inserir nova
          const { error } = await supabase
            .from("client_google_accounts")
            .insert(update);
            
          if (error) {
            console.error("❌ Erro ao inserir conta Google:", error);
            throw error;
          }
        }
      }
      
      console.log("✅ Todas as alterações foram salvas com sucesso");
    },
    onSuccess: () => {
      toast({
        title: "Orçamentos salvos",
        description: "Todos os orçamentos foram atualizados com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["budget-manager-clients"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao salvar orçamentos:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações nos orçamentos.",
        variant: "destructive"
      });
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
    saveMutation.mutate();
  };

  return {
    clients,
    isLoading,
    budgets,
    totalBudget,
    totalGoogleBudget,
    handleBudgetChange,
    handleBudgetBlur,
    handleAccountIdChange,
    handleGoogleBudgetChange,
    handleGoogleAccountIdChange,
    handleSave,
    addSecondaryAccount,
    isSaving: saveMutation.isPending
  };
}
