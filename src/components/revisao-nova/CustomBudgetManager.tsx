
import { useState, useEffect } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { CustomBudgetTable } from "./custom-budget/CustomBudgetTable";
import { CustomBudgetForm } from "./custom-budget/CustomBudgetForm";
import { useCustomBudgets, CustomBudgetFormData } from "./hooks/useCustomBudgets";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateBr } from "@/utils/dateFormatter";

export const CustomBudgetManager = () => {
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const queryClient = useQueryClient();

  const {
    filteredClients,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedBudget,
    setSelectedBudget,
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation,
    formatBudget,
    isCurrentlyActive,
    isFutureBudget
  } = useCustomBudgets();

  // Monitorar estado das mutações para atualizar dados quando necessário
  useEffect(() => {
    // Verificar se alguma mutação foi bem-sucedida para atualizar os dados
    if (addCustomBudgetMutation.isSuccess || 
        updateCustomBudgetMutation.isSuccess || 
        deleteCustomBudgetMutation.isSuccess || 
        toggleBudgetStatusMutation.isSuccess) {
      // Invalidar consultas para recarregar os dados atualizados
      queryClient.invalidateQueries({ queryKey: ["clients-with-custom-budgets"] });
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    }
  }, [
    queryClient,
    addCustomBudgetMutation.isSuccess, 
    updateCustomBudgetMutation.isSuccess, 
    deleteCustomBudgetMutation.isSuccess, 
    toggleBudgetStatusMutation.isSuccess
  ]);

  // Função para converter o formato do orçamento para o formato esperado pelo form
  const convertBudgetToFormData = (budget: any): CustomBudgetFormData => {
    return {
      clientId: budget.client_id,
      budgetAmount: budget.budget_amount,
      startDate: budget.start_date,
      endDate: budget.end_date,
      description: budget.description || "",
      platform: budget.platform || "meta"
    };
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-muran-dark">
          Orçamentos Personalizados
        </CardTitle>
        <CardDescription className="mt-1">
          Configure orçamentos com períodos personalizados para cada cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Orçamentos</TabsTrigger>
            <TabsTrigger value="form">
              {selectedBudget ? "Editar Orçamento" : "Novo Orçamento"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <CustomBudgetTable
              filteredClients={filteredClients}
              isLoading={isLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              formatDate={formatDateBr}
              formatBudget={formatBudget}
              isCurrentlyActive={isCurrentlyActive}
              isFutureBudget={isFutureBudget}
              onEdit={(budget) => {
                setSelectedBudget(budget);
                setSelectedTab("form");
              }}
              onDelete={(budgetInfo) => deleteCustomBudgetMutation.mutate(budgetInfo)}
              onToggleStatus={(id, isActive, platform) => 
                toggleBudgetStatusMutation.mutate({ id, isActive, platform })
              }
            />
          </TabsContent>

          <TabsContent value="form">
            <CustomBudgetForm
              selectedBudget={selectedBudget ? convertBudgetToFormData(selectedBudget) : null}
              isSubmitting={
                addCustomBudgetMutation.isPending || 
                updateCustomBudgetMutation.isPending
              }
              onSubmit={(formData: CustomBudgetFormData) => {
                if (selectedBudget) {
                  updateCustomBudgetMutation.mutate({
                    id: selectedBudget.id,
                    ...formData
                  });
                } else {
                  addCustomBudgetMutation.mutate(formData);
                }
                setSelectedBudget(null);
                setSelectedTab("active");
              }}
              onCancel={() => {
                setSelectedBudget(null);
                setSelectedTab("active");
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
