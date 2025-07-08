
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type ClientWithAccounts = {
  id: string;
  company_name: string;
  status: string;
  client_accounts: Array<{
    id: string;
    platform: 'meta' | 'google';
    account_id: string;
    budget_amount: number;
    is_primary: boolean;
  }>;
};

type BudgetValues = {
  meta: string;
  accountId: string;
  googleMeta: string;
  googleAccountId: string;
};

export const useBudgetSetup = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<Record<string, BudgetValues>>({});
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
        // Buscar conta Meta primária
        const metaAccount = client.client_accounts.find(acc => 
          acc.platform === 'meta' && acc.is_primary
        );
        
        // Buscar conta Google primária
        const googleAccount = client.client_accounts.find(acc => 
          acc.platform === 'google' && acc.is_primary
        );
        
        initialBudgets[client.id] = {
          meta: metaAccount?.budget_amount ? metaAccount.budget_amount.toString() : "",
          accountId: metaAccount?.account_id || "",
          googleMeta: googleAccount?.budget_amount ? googleAccount.budget_amount.toString() : "",
          googleAccountId: googleAccount?.account_id || ""
        };
        
        console.log(`✅ Inicializado para ${client.company_name}:`, initialBudgets[client.id]);
      });
      
      setBudgets(initialBudgets);
    }
  }, [clients]);

  // Mutation para salvar orçamentos
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      console.log("💾 Iniciando salvamento de orçamentos...");
      
      const clientsToUpdate = Object.entries(budgets).filter(([clientId, values]) => {
        return clientId && (values.meta || values.accountId || values.googleMeta || values.googleAccountId);
      });
      
      console.log("📋 Clientes a serem atualizados:", clientsToUpdate.length);
      
      if (clientsToUpdate.length === 0) {
        console.log("⚠️ Nenhum cliente para atualizar");
        return true;
      }

      for (const [clientId, values] of clientsToUpdate) {
        console.log(`🔄 Processando cliente ${clientId}:`, values);
        
        // Processar conta Meta
        if (values.meta || values.accountId) {
          const metaBudget = values.meta ? parseFloat(values.meta.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0 : 0;
          
          // Verificar se já existe conta Meta para este cliente
          const { data: existingMeta } = await supabase
            .from("client_accounts")
            .select("id")
            .eq("client_id", clientId)
            .eq("platform", "meta")
            .eq("is_primary", true)
            .single();
          
          if (existingMeta) {
            // Atualizar conta existente
            const { error } = await supabase
              .from("client_accounts")
              .update({
                account_id: values.accountId || "",
                budget_amount: metaBudget
              })
              .eq("id", existingMeta.id);
            
            if (error) throw error;
            console.log(`✅ Conta Meta atualizada para cliente ${clientId}`);
          } else if (values.accountId) {
            // Criar nova conta Meta
            const { error } = await supabase
              .from("client_accounts")
              .insert({
                client_id: clientId,
                platform: "meta",
                account_id: values.accountId,
                account_name: "Conta Meta Ads",
                budget_amount: metaBudget,
                is_primary: true,
                status: "active"
              });
            
            if (error) throw error;
            console.log(`✅ Nova conta Meta criada para cliente ${clientId}`);
          }
        }
        
        // Processar conta Google
        if (values.googleMeta || values.googleAccountId) {
          const googleBudget = values.googleMeta ? parseFloat(values.googleMeta.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0 : 0;
          
          // Verificar se já existe conta Google para este cliente
          const { data: existingGoogle } = await supabase
            .from("client_accounts")
            .select("id")
            .eq("client_id", clientId)
            .eq("platform", "google")
            .eq("is_primary", true)
            .single();
          
          if (existingGoogle) {
            // Atualizar conta existente
            const { error } = await supabase
              .from("client_accounts")
              .update({
                account_id: values.googleAccountId || "",
                budget_amount: googleBudget
              })
              .eq("id", existingGoogle.id);
            
            if (error) throw error;
            console.log(`✅ Conta Google atualizada para cliente ${clientId}`);
          } else if (values.googleAccountId) {
            // Criar nova conta Google
            const { error } = await supabase
              .from("client_accounts")
              .insert({
                client_id: clientId,
                platform: "google",
                account_id: values.googleAccountId,
                account_name: "Conta Google Ads",
                budget_amount: googleBudget,
                is_primary: true,
                status: "active"
              });
            
            if (error) throw error;
            console.log(`✅ Nova conta Google criada para cliente ${clientId}`);
          }
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

  const handleBudgetChange = (clientId: string, value: string) => {
    const sanitizedValue = value.replace(/[^0-9,.]/g, "");
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        meta: sanitizedValue,
      },
    }));
  };

  const handleGoogleBudgetChange = (clientId: string, value: string) => {
    const sanitizedValue = value.replace(/[^0-9,.]/g, "");
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        googleMeta: sanitizedValue,
      },
    }));
  };

  const handleAccountIdChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        accountId: value,
      },
    }));
  };

  const handleGoogleAccountIdChange = (clientId: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        googleAccountId: value,
      },
    }));
  };

  const handleSave = () => {
    console.log("💾 Iniciando processo de salvamento:", budgets);
    saveBudgetsMutation.mutate();
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
    filteredClients
  };
};

// Exportar tipos atualizados
export type { ClientWithAccounts as ClientBudget, BudgetValues };
