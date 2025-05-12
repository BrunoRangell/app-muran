
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { CustomBudget, CustomBudgetFormData } from "../../hooks/useCustomBudgets";

interface UseBudgetTabManagerProps {
  addCustomBudgetMutation: any;
  updateCustomBudgetMutation: any;
  deleteCustomBudgetMutation: any;
  toggleBudgetStatusMutation: any;
  duplicateBudgetMutation: any;
}

export function useBudgetTabManager({
  addCustomBudgetMutation,
  updateCustomBudgetMutation,
  deleteCustomBudgetMutation,
  toggleBudgetStatusMutation,
  duplicateBudgetMutation,
}: UseBudgetTabManagerProps) {
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const [selectedBudget, setSelectedBudget] = useState<CustomBudget | null>(null);
  const queryClient = useQueryClient();

  // Monitorar estado das mutações para atualizar dados quando necessário
  useEffect(() => {
    // Verificar se alguma mutação foi bem-sucedida para atualizar os dados
    if (addCustomBudgetMutation.isSuccess || 
        updateCustomBudgetMutation.isSuccess || 
        deleteCustomBudgetMutation.isSuccess || 
        toggleBudgetStatusMutation.isSuccess ||
        duplicateBudgetMutation.isSuccess) {
      // Invalidar consultas para recarregar os dados atualizados
      queryClient.invalidateQueries({ queryKey: ["custom-budgets"] });
      queryClient.invalidateQueries({ queryKey: ["clients-with-custom-budgets"] });
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    }
  }, [
    queryClient,
    addCustomBudgetMutation.isSuccess, 
    updateCustomBudgetMutation.isSuccess, 
    deleteCustomBudgetMutation.isSuccess, 
    toggleBudgetStatusMutation.isSuccess,
    duplicateBudgetMutation.isSuccess
  ]);

  // Função para converter o formato do orçamento para o formato esperado pelo form
  const convertBudgetToFormData = (budget: CustomBudget): CustomBudgetFormData => {
    return {
      clientId: budget.client_id,
      budgetAmount: budget.budget_amount,
      startDate: budget.start_date,
      endDate: budget.end_date,
      platform: budget.platform || 'meta',
      description: budget.description || "",
      isRecurring: budget.is_recurring || false,
      recurrencePattern: budget.recurrence_pattern || null
    };
  };

  const handleEditBudget = (budget: CustomBudget) => {
    setSelectedBudget(budget);
    setSelectedTab("form");
  };

  const handleAddNewBudget = () => {
    setSelectedBudget(null);
    setSelectedTab("form");
  };

  const handleFormSubmit = (formData: CustomBudgetFormData) => {
    console.log("Formulário submetido:", formData);
    
    if (selectedBudget) {
      console.log("Atualizando orçamento existente:", selectedBudget.id);
      updateCustomBudgetMutation.mutate({
        id: selectedBudget.id,
        ...formData
      });
    } else {
      console.log("Criando novo orçamento");
      addCustomBudgetMutation.mutate(formData);
    }
    
    // Se a mutação foi bem-sucedida, mudamos de tab
    if (!addCustomBudgetMutation.isPending && !updateCustomBudgetMutation.isPending) {
      if (addCustomBudgetMutation.isSuccess || updateCustomBudgetMutation.isSuccess) {
        setSelectedBudget(null);
        setSelectedTab("active");
      }
    }
  };

  const handleFormCancel = () => {
    setSelectedBudget(null);
    setSelectedTab("active");
  };

  return {
    selectedTab,
    setSelectedTab,
    selectedBudget,
    setSelectedBudget,
    handleEditBudget,
    handleAddNewBudget,
    handleFormSubmit,
    handleFormCancel,
    convertBudgetToFormData,
    isSubmitting: addCustomBudgetMutation.isPending || updateCustomBudgetMutation.isPending
  };
}
