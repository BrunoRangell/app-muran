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
          client_accounts!inner (
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
        .eq("client_accounts.status", "active")
        .order("company_name");

      if (error) {
        console.error("❌ Erro ao buscar clientes com contas:", error);
        throw error;
      }

      console.log("✅ Clientes carregados:", data?.length, data);
      return data as ClientWithAccounts[];
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
      
      return true;
    },
    onSuccess: () => {
      console.log("🎉 Orçamentos salvos com sucesso!");
      toast({
        title: "Orçamentos salvos",
        description: "Os orçamentos foram atualizados com sucesso.",
      });
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
    setSelectedClientForAdd({ id: clientId, name: clientName });
    setIsAddModalOpen(true);
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
    if (window.confirm("Tem certeza que deseja remover esta conta secundária?")) {
      deleteSecondaryAccountMutation.mutate(accountId);
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
    // Novas funcionalidades
    isAddModalOpen,
    setIsAddModalOpen,
    selectedClientForAdd,
    handleAddSecondaryAccount,
    handleCreateSecondaryAccount,
    handleDeleteSecondaryAccount,
    createSecondaryAccountMutation,
    deleteSecondaryAccountMutation
  };
};

// Exportar tipos atualizados
export type { ClientWithAccounts as ClientBudget, BudgetValues };
