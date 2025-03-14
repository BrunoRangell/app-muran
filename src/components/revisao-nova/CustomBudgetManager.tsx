
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
import { useCustomBudgets } from "./hooks/useCustomBudgets";
import { useQueryClient } from "@tanstack/react-query";

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
    formatDate,
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

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-muran-dark">
          Orçamentos Personalizados Meta Ads
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
              formatDate={formatDate}
              formatBudget={formatBudget}
              isCurrentlyActive={isCurrentlyActive}
              isFutureBudget={isFutureBudget}
              onEdit={(budget) => {
                setSelectedBudget(budget);
                setSelectedTab("form");
              }}
              onDelete={(id) => deleteCustomBudgetMutation.mutate(id)}
              onToggleStatus={(id, isActive) => 
                toggleBudgetStatusMutation.mutate({ id, isActive })
              }
            />
          </TabsContent>

          <TabsContent value="form">
            <CustomBudgetForm
              selectedBudget={selectedBudget}
              isSubmitting={
                addCustomBudgetMutation.isPending || 
                updateCustomBudgetMutation.isPending
              }
              onSubmit={(data) => {
                if (selectedBudget) {
                  updateCustomBudgetMutation.mutate({
                    id: selectedBudget.id,
                    ...data
                  });
                } else {
                  addCustomBudgetMutation.mutate(data);
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
