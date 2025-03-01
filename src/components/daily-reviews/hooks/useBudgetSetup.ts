
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type ClientBudget = {
  id: string;
  company_name: string;
  meta_ads_budget: number;
  meta_account_id: string | null;
  status: string;
};

type BudgetValues = {
  meta: string;
  accountId: string;
};

export const useBudgetSetup = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<Record<string, BudgetValues>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os clientes
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients-budget-setup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, meta_ads_budget, meta_account_id, status")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }
      console.log("Clientes carregados:", data);
      return data as ClientBudget[];
    },
  });

  // Inicializar orçamentos a partir dos dados obtidos
  useEffect(() => {
    if (clients) {
      console.log("Inicializando orçamentos a partir dos clientes carregados");
      const initialBudgets: Record<string, BudgetValues> = {};
      clients.forEach((client) => {
        initialBudgets[client.id] = {
          meta: client.meta_ads_budget ? client.meta_ads_budget.toString() : "",
          accountId: client.meta_account_id || ""
        };
      });
      setBudgets(initialBudgets);
    }
  }, [clients]);

  // Mutation para salvar orçamentos
  const saveBudgetsMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando salvamento de orçamentos...");
      
      // Filtrar apenas os clientes que possuem dados em budgets para atualizar
      const clientsToUpdate = Object.entries(budgets).filter(([clientId, values]) => {
        return clientId && (values.meta || values.accountId);
      });
      
      console.log("Clientes a serem atualizados:", clientsToUpdate);
      
      if (clientsToUpdate.length === 0) {
        console.log("Nenhum cliente para atualizar");
        return true;
      }

      // Preparar os dados para atualização
      const updates = clientsToUpdate.map(([clientId, values]) => {
        // Tratar o valor do orçamento corretamente
        const rawValue = values.meta ? values.meta.replace(/[^\d,.-]/g, '').replace(',', '.') : "0";
        const metaBudget = parseFloat(rawValue) || 0;
        
        console.log(`Preparando atualização para cliente ${clientId}:`, {
          metaBudget,
          accountId: values.accountId
        });
        
        // Retornar objeto formatado para update
        return {
          id: clientId,
          meta_ads_budget: metaBudget,
          meta_account_id: values.accountId || null
        };
      });

      console.log("Objetos preparados para atualização:", updates);

      // Realizar atualização em lote
      for (const update of updates) {
        const { data, error } = await supabase
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
        
        console.log(`Cliente ${update.id} atualizado com sucesso`);
      }
      
      return true;
    },
    onSuccess: () => {
      console.log("Orçamentos salvos com sucesso!");
      toast({
        title: "Orçamentos salvos",
        description: "Os orçamentos mensais foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["clients-budget-setup"] });
    },
    onError: (error) => {
      console.error("Detalhes do erro:", error);
      toast({
        title: "Erro ao salvar orçamentos",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleBudgetChange = (clientId: string, value: string) => {
    // Certifique-se de que aceitamos apenas números e pontos
    const sanitizedValue = value.replace(/[^0-9,.]/g, "");
    
    setBudgets((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        meta: sanitizedValue,
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

  const handleSave = () => {
    console.log("Tentando salvar orçamentos:", budgets);
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
    handleAccountIdChange,
    handleSave,
    filteredClients
  };
};

export type { ClientBudget, BudgetValues };
