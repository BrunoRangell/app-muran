
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CustomBudgetFormV2 } from "../budget/CustomBudgetFormV2";
import { CustomBudgetTableV2 } from "../budget/CustomBudgetTableV2";
import { useToast } from "@/hooks/use-toast";

// Interface para os dados do formulário de orçamento personalizado
export interface CustomBudgetFormData {
  clientId: string;
  accountId?: string;
  platform: "meta" | "google";
  budgetAmount: number;
  startDate: string;
  endDate: string;
  description?: string;
}

// Interface para o orçamento personalizado na tabela
interface CustomBudgetData {
  id: string;
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
  platform: "meta" | "google";
  account_name?: string;
  client: {
    id: string;
    company_name: string;
  };
  account_id?: string; // Campo adicionado para compatibilidade
}

export function CustomBudgetTabV2() {
  const [selectedTab, setSelectedTab] = useState<string>("list");
  const [selectedBudget, setSelectedBudget] = useState<CustomBudgetData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar clientes com orçamentos personalizados
  const { data: clientsWithBudgets, isLoading } = useQuery({
    queryKey: ["clients-with-custom-budgets-v2", searchTerm],
    queryFn: async () => {
      // Consulta para orçamentos personalizados Meta
      const { data: metaBudgets, error: metaError } = await supabase
        .from("meta_custom_budgets")
        .select("*, client:clients(id, company_name)")
        .ilike("client.company_name", `%${searchTerm}%`)
        .order("created_at", { ascending: false });

      if (metaError) {
        console.error("Erro ao buscar orçamentos Meta:", metaError);
        throw new Error("Não foi possível buscar orçamentos personalizados Meta");
      }

      // Consulta para orçamentos personalizados Google
      const { data: googleBudgets, error: googleError } = await supabase
        .from("custom_budgets")
        .select("*, client:clients(id, company_name)")
        .eq("platform", "google")
        .ilike("client.company_name", `%${searchTerm}%`)
        .order("created_at", { ascending: false });

      if (googleError) {
        console.error("Erro ao buscar orçamentos Google:", googleError);
        throw new Error("Não foi possível buscar orçamentos personalizados Google");
      }

      // Adicionar campos necessários para compatibilidade
      const processedMetaBudgets = metaBudgets.map((budget: any) => ({
        ...budget,
        platform: "meta",
        account_name: "Meta Ads", // Padrão para orçamentos antigos
        account_id: budget.account_id || null
      }));

      const processedGoogleBudgets = googleBudgets.map((budget: any) => ({
        ...budget,
        platform: "google",
        account_name: "Google Ads", // Padrão para orçamentos antigos
        account_id: budget.account_id || null
      }));

      // Combinar resultados
      let allBudgets = [...processedMetaBudgets, ...processedGoogleBudgets];

      // Buscar nomes de conta para aqueles com account_id definido
      const metaAccountIds = allBudgets
        .filter((budget) => budget.platform === "meta" && budget.account_id)
        .map((budget) => budget.account_id);

      const googleAccountIds = allBudgets
        .filter((budget) => budget.platform === "google" && budget.account_id)
        .map((budget) => budget.account_id);

      // Buscar detalhes das contas Meta, se houver
      if (metaAccountIds.length > 0) {
        const { data: metaAccounts } = await supabase
          .from("client_meta_accounts")
          .select("account_id, account_name")
          .in("account_id", metaAccountIds);

        if (metaAccounts) {
          const accountMap = Object.fromEntries(
            metaAccounts.map((acc) => [acc.account_id, acc.account_name])
          );
          
          allBudgets = allBudgets.map(budget => {
            if (budget.platform === "meta" && budget.account_id && accountMap[budget.account_id]) {
              return {
                ...budget,
                account_name: accountMap[budget.account_id]
              };
            }
            return budget;
          });
        }
      }

      // Buscar detalhes das contas Google, se houver
      if (googleAccountIds.length > 0) {
        const { data: googleAccounts } = await supabase
          .from("client_google_accounts")
          .select("account_id, account_name")
          .in("account_id", googleAccountIds);

        if (googleAccounts) {
          const accountMap = Object.fromEntries(
            googleAccounts.map((acc) => [acc.account_id, acc.account_name])
          );
          
          allBudgets = allBudgets.map(budget => {
            if (budget.platform === "google" && budget.account_id && accountMap[budget.account_id]) {
              return {
                ...budget,
                account_name: accountMap[budget.account_id]
              };
            }
            return budget;
          });
        }
      }

      return allBudgets as CustomBudgetData[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutação para adicionar um novo orçamento personalizado
  const addBudgetMutation = useMutation({
    mutationFn: async (formData: CustomBudgetFormData) => {
      const table = formData.platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      const { data, error } = await supabase
        .from(table)
        .insert({
          client_id: formData.clientId,
          account_id: formData.accountId || null,
          budget_amount: formData.budgetAmount,
          start_date: formData.startDate,
          end_date: formData.endDate,
          is_active: true,
          description: formData.description || null,
          ...(formData.platform === "google" ? { platform: "google" } : {})
        })
        .select();

      if (error) {
        throw new Error(`Erro ao adicionar orçamento: ${error.message}`);
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients-with-custom-budgets-v2"]
      });
      toast({
        title: "Orçamento adicionado",
        description: "O orçamento personalizado foi adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar um orçamento personalizado existente
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...formData }: CustomBudgetFormData & { id: string }) => {
      const table = formData.platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      const { error } = await supabase
        .from(table)
        .update({
          client_id: formData.clientId,
          account_id: formData.accountId || null,
          budget_amount: formData.budgetAmount,
          start_date: formData.startDate,
          end_date: formData.endDate,
          description: formData.description || null,
        })
        .eq("id", id);

      if (error) {
        throw new Error(`Erro ao atualizar orçamento: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients-with-custom-budgets-v2"]
      });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento personalizado foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir um orçamento personalizado
  const deleteBudgetMutation = useMutation({
    mutationFn: async ({ id, platform }: { id: string; platform: "meta" | "google" }) => {
      const table = platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Erro ao excluir orçamento: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients-with-custom-budgets-v2"]
      });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento personalizado foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para alternar o status de um orçamento personalizado
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, platform, isActive }: { id: string; platform: "meta" | "google"; isActive: boolean }) => {
      const table = platform === "meta" ? "meta_custom_budgets" : "custom_budgets";
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) {
        throw new Error(`Erro ao atualizar status: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients-with-custom-budgets-v2"]
      });
      toast({
        title: "Status atualizado",
        description: "O status do orçamento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Utilitários para formatação
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatBudget = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Verifica se um orçamento está ativo com base nas datas
  const isCurrentlyActive = (budget: CustomBudgetData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(budget.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(budget.end_date);
    endDate.setHours(23, 59, 59, 999);
    
    return budget.is_active && today >= startDate && today <= endDate;
  };

  // Verifica se um orçamento é para o futuro
  const isFutureBudget = (budget: CustomBudgetData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(budget.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    return budget.is_active && startDate > today;
  };

  // Reset do orçamento selecionado quando mudar de tab
  useState(() => {
    if (selectedTab === "list") {
      setSelectedBudget(null);
    }
  });

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-[#321e32]">
          Orçamentos Personalizados
        </CardTitle>
        <CardDescription className="mt-1">
          Configure orçamentos com períodos personalizados para clientes ou contas específicas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="list">Lista de Orçamentos</TabsTrigger>
            <TabsTrigger value="add">
              {selectedBudget ? "Editar Orçamento" : "Novo Orçamento"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <CustomBudgetTableV2
              budgets={clientsWithBudgets || []}
              isLoading={isLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              formatDate={formatDate}
              formatBudget={formatBudget}
              isCurrentlyActive={isCurrentlyActive}
              isFutureBudget={isFutureBudget}
              onEdit={(budget) => {
                setSelectedBudget(budget);
                setSelectedTab("add");
              }}
              onDelete={(id, platform) => deleteBudgetMutation.mutate({ id, platform })}
              onToggleStatus={(id, platform, isActive) => 
                toggleStatusMutation.mutate({ id, platform, isActive })
              }
            />
          </TabsContent>

          <TabsContent value="add">
            <CustomBudgetFormV2
              selectedBudget={selectedBudget}
              isSubmitting={
                addBudgetMutation.isPending || 
                updateBudgetMutation.isPending
              }
              onSubmit={(formData: CustomBudgetFormData) => {
                if (selectedBudget) {
                  updateBudgetMutation.mutate({
                    id: selectedBudget.id,
                    ...formData,
                    platform: selectedBudget.platform as "meta" | "google",
                  });
                } else {
                  addBudgetMutation.mutate(formData);
                }
                setSelectedBudget(null);
                setSelectedTab("list");
              }}
              onCancel={() => {
                setSelectedBudget(null);
                setSelectedTab("list");
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
