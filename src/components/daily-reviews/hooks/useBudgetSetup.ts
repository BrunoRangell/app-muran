import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { parseBrazilianCurrency } from "@/utils/currencyUtils";

type ClientWithAccounts = {
  id: string;
  company_name: string;
  status: string;
  client_accounts: Array<{
    id: string;
    platform: 'meta' | 'google';
    account_id: string;
    account_name: string;
    budget_amount: number;
    is_primary: boolean;
  }>;
};

type BudgetValues = {
  account_id: string;
  budget_amount: string;
};

export const useBudgetSetup = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<Record<string, BudgetValues>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForAdd, setSelectedClientForAdd] = useState<{id: string, name: string} | null>(null);
  const [temporaryAccounts, setTemporaryAccounts] = useState<Record<string, Array<{id: string, platform: 'meta' | 'google', name: string}>>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{id: string, name: string} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar clientes com suas contas
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-with-accounts-setup"],
    queryFn: async () => {
      console.log("🔍 Buscando clientes com contas para configuração...");
      
      const { data, error } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          status,
          client_accounts (
            id,
            platform,
            account_id,
            account_name,
            budget_amount,
            is_primary,
            status
          )
        `)
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("❌ Erro ao buscar clientes com contas:", error);
        throw error;
      }

      // Filtrar apenas contas ativas e processar dados
      const processedData = data?.map(client => ({
        ...client,
        client_accounts: (client.client_accounts || []).filter(account => account.status === 'active')
      })) || [];

      console.log("✅ Clientes carregados:", processedData?.length, processedData);
      return processedData as ClientWithAccounts[];
    },
  });

  // Inicializar orçamentos a partir dos dados obtidos
  useEffect(() => {
    if (clients) {
      console.log("🚀 Inicializando orçamentos a partir dos clientes carregados");
      
      const initialBudgets: Record<string, BudgetValues> = {};
      
      clients.forEach((client) => {
        // Inicializar todas as contas do cliente
        client.client_accounts.forEach((account) => {
          initialBudgets[account.id] = {
            account_id: account.account_id || "",
            budget_amount: account.budget_amount ? account.budget_amount.toString() : ""
          };
        });
        
        // Inicializar campos vazios para clientes sem contas (para permitir preenchimento futuro)
        if (client.client_accounts.length === 0) {
          const metaKey = `${client.id}-meta-temp`;
          initialBudgets[metaKey] = {
            account_id: "",
            budget_amount: ""
          };
        }
        
        console.log(`✅ Inicializado para ${client.company_name}:`, client.client_accounts.length, "contas");
      });
      
      setBudgets(initialBudgets);
    }
  }, [clients]);

  // Mutation para criar conta secundária
  const createSecondaryAccountMutation = useMutation({
    mutationFn: async (data: {
      clientId: string;
      platform: 'meta' | 'google';
      accountName: string;
      accountId: string;
      budgetAmount: number;
    }) => {
      console.log("🔄 Criando conta secundária:", data);
      
      const { error } = await supabase
        .from("client_accounts")
        .insert({
          client_id: data.clientId,
          platform: data.platform,
          account_name: data.accountName,
          account_id: data.accountId,
          budget_amount: data.budgetAmount,
          is_primary: false,
          status: 'active'
        });
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      console.log("✅ Conta secundária criada com sucesso!");
      toast({
        title: "Conta criada",
        description: "A conta secundária foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["clients-with-accounts-setup"] });
      setIsAddModalOpen(false);
      setSelectedClientForAdd(null);
    },
    onError: (error) => {
      console.error("❌ Erro ao criar conta secundária:", error);
      toast({
        title: "Erro ao criar conta",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar conta secundária
  const deleteSecondaryAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      console.log("🗑️ Deletando conta secundária:", accountId);
      
      const { error } = await supabase
        .from("client_accounts")
        .delete()
        .eq("id", accountId)
        .eq("is_primary", false); // Garantir que só deletamos contas secundárias
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      console.log("✅ Conta secundária deletada com sucesso!");
      toast({
        title: "Conta removida",
        description: "A conta secundária foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["clients-with-accounts-setup"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao deletar conta secundária:", error);
      toast({
        title: "Erro ao remover conta",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Mutation para salvar orçamentos
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      console.log("💾 Iniciando salvamento de orçamentos...");
      
      const accountsToUpdate = Object.entries(budgets).filter(([accountId, values]) => {
        return accountId && (values.account_id || values.budget_amount);
      });
      
      console.log("📋 Contas a serem atualizadas:", accountsToUpdate.length);
      
      if (accountsToUpdate.length === 0) {
        console.log("⚠️ Nenhuma conta para atualizar");
        return true;
      }

      for (const [accountId, values] of accountsToUpdate) {
        console.log(`🔄 Processando conta ${accountId}:`, values);
        
        const budgetAmount = values.budget_amount ? 
          parseFloat(values.budget_amount.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0 : 0;
        
        // Verificar se é uma conta temporária que precisa ser criada
        if (accountId.includes('-temp-')) {
          const clientId = accountId.split('-temp-')[0];
          
          // Criar nova conta no banco de dados
          const { data: newAccount, error: createError } = await supabase
            .from("client_accounts")
            .insert({
              client_id: clientId,
              platform: 'meta',
              account_name: `Conta Meta`,
              account_id: values.account_id || "",
              budget_amount: budgetAmount,
              is_primary: false,
              status: 'active'
            })
            .select()
            .single();
          
          if (createError) throw createError;
          console.log(`✅ Nova conta criada para cliente ${clientId}`);
        } else if (accountId.includes('-meta-temp')) {
          // Conta temporária para cliente sem contas
          const clientId = accountId.split('-meta-temp')[0];
          
          if (values.account_id || values.budget_amount) {
            const { error: createError } = await supabase
              .from("client_accounts")
              .insert({
                client_id: clientId,
                platform: 'meta',
                account_name: `Conta Meta`,
                account_id: values.account_id || "",
                budget_amount: budgetAmount,
                is_primary: true,
                status: 'active'
              });
            
            if (createError) throw createError;
            console.log(`✅ Primeira conta criada para cliente ${clientId}`);
          }
        } else {
          // Atualizar conta existente
          const { error } = await supabase
            .from("client_accounts")
            .update({
              account_id: values.account_id || "",
              budget_amount: budgetAmount
            })
            .eq("id", accountId);
          
          if (error) throw error;
          console.log(`✅ Conta ${accountId} atualizada`);
        }
      }
      
      return true;
    },
    onSuccess: () => {
      console.log("🎉 Orçamentos salvos com sucesso!");
      toast({
        title: "Orçamentos salvos",
        description: "Os orçamentos foram atualizados com sucesso.",
      });
      // Limpar contas temporárias após salvar
      setTemporaryAccounts({});
      queryClient.invalidateQueries({ queryKey: ["clients-with-accounts-setup"] });
      queryClient.invalidateQueries({ queryKey: ["budget-manager-data"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao salvar orçamentos:", error);
      toast({
        title: "Erro ao salvar orçamentos",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleBudgetChange = (accountId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        budget_amount: value,
      },
    }));
  };

  const handleAccountIdChange = (accountId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        account_id: value,
      },
    }));
  };

  // Handlers para compatibilidade - agora apontam para os handlers principais
  const handleGoogleBudgetChange = handleBudgetChange;
  const handleGoogleAccountIdChange = handleAccountIdChange;

  const handleSave = () => {
    console.log("💾 Iniciando processo de salvamento:", budgets);
    
    // Converter valores formatados para números antes de salvar
    const processedBudgets: Record<string, BudgetValues> = {};
    Object.entries(budgets).forEach(([accountId, values]) => {
      processedBudgets[accountId] = {
        ...values,
        budget_amount: parseBrazilianCurrency(values.budget_amount).toString()
      };
    });
    
    setBudgets(processedBudgets);
    saveBudgetsMutation.mutate();
  };

  const handleAddSecondaryAccount = (clientId: string, clientName: string) => {
    // Adicionar linha temporária instantaneamente
    const tempId = `${clientId}-temp-${Date.now()}`;
    const newTempAccount = {
      id: tempId,
      platform: 'meta' as const,
      name: `${clientName} - secundária`
    };
    
    setTemporaryAccounts(prev => ({
      ...prev,
      [clientId]: [...(prev[clientId] || []), newTempAccount]
    }));
    
    // Inicializar budget para a conta temporária
    setBudgets(prev => ({
      ...prev,
      [tempId]: {
        account_id: "",
        budget_amount: ""
      }
    }));
  };

  const handleCreateSecondaryAccount = (data: {
    platform: 'meta' | 'google';
    accountName: string;
    accountId: string;
    budgetAmount: number;
  }) => {
    if (!selectedClientForAdd) return;
    
    createSecondaryAccountMutation.mutate({
      clientId: selectedClientForAdd.id,
      ...data
    });
  };

  const handleDeleteSecondaryAccount = (accountId: string) => {
    // Encontrar o nome da conta para mostrar no diálogo
    const account = clients?.flatMap(client => client.client_accounts).find(acc => acc.id === accountId);
    const accountName = account?.account_name || "conta secundária";
    
    setAccountToDelete({ id: accountId, name: accountName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    if (accountToDelete) {
      deleteSecondaryAccountMutation.mutate(accountToDelete.id);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const filteredClients = clients?.filter(
    (client) =>
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    searchTerm,
    setSearchTerm,
    budgets,
    clients,
    isLoading,
    saveBudgetsMutation,
    handleBudgetChange,
    handleGoogleBudgetChange,
    handleAccountIdChange,
    handleGoogleAccountIdChange,
    handleSave,
    filteredClients,
    temporaryAccounts,
    // Novas funcionalidades
    isAddModalOpen,
    setIsAddModalOpen,
    selectedClientForAdd,
    handleAddSecondaryAccount,
    handleCreateSecondaryAccount,
    handleDeleteSecondaryAccount,
    createSecondaryAccountMutation,
    deleteSecondaryAccountMutation,
    // Estados do diálogo de confirmação
    deleteDialogOpen,
    setDeleteDialogOpen,
    accountToDelete,
    confirmDeleteAccount
  };
};

// Exportar tipos atualizados
export type { ClientWithAccounts as ClientBudget, BudgetValues };
