
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { CustomBudgetForm } from "./custom-budget/CustomBudgetForm";
import { useCustomBudgets } from "./hooks/useCustomBudgets";
import { BudgetManagerHeader } from "./custom-budget/manager/BudgetManagerHeader";
import { FilterControls } from "./custom-budget/manager/FilterControls";
import { BudgetContent } from "./custom-budget/manager/BudgetContent";
import { useBudgetTabManager } from "./custom-budget/manager/useBudgetTabManager";
import { useViewModeControls } from "./custom-budget/manager/useViewModeControls";

interface CustomBudgetManagerProps {
  viewMode?: "list" | "cards" | "calendar";
}

export const CustomBudgetManager = ({ viewMode = "list" }: CustomBudgetManagerProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Hooks personalizados para controlar a UI
  const viewControls = useViewModeControls({ initialViewMode: viewMode });
  
  // Hook para gerenciar consultas e operações de dados
  const {
    filteredClients,
    isLoading,
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation,
    duplicateBudgetMutation,
    formatDate,
    formatBudget,
    isCurrentlyActive,
    isFutureBudget,
    exportToCSV,
    getBudgetStats
  } = useCustomBudgets({ 
    sortBy: viewControls.sortBy, 
    statusFilter: viewControls.statusFilter, 
    platformFilter: viewControls.platformFilter 
  });
  
  // Hook para gerenciar abas e a lógica do formulário
  const tabManager = useBudgetTabManager({
    addCustomBudgetMutation,
    updateCustomBudgetMutation,
    deleteCustomBudgetMutation,
    toggleBudgetStatusMutation,
    duplicateBudgetMutation
  });

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <BudgetManagerHeader 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          getBudgetStats={getBudgetStats}
          exportToCSV={exportToCSV}
          onAddNewBudget={tabManager.handleAddNewBudget}
        />

        <FilterControls 
          platformFilter={viewControls.platformFilter}
          setPlatformFilter={viewControls.setPlatformFilter}
          statusFilter={viewControls.statusFilter}
          setStatusFilter={viewControls.setStatusFilter}
          setSortBy={viewControls.setSortBy}
          displayMode={viewControls.displayMode}
          setDisplayMode={viewControls.setDisplayMode}
        />
      </CardHeader>
      
      <CardContent>
        <Tabs value={tabManager.selectedTab} onValueChange={tabManager.setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Orçamentos</TabsTrigger>
            <TabsTrigger value="form">
              {tabManager.selectedBudget ? "Editar Orçamento" : "Novo Orçamento"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <BudgetContent 
              displayMode={viewControls.displayMode}
              filteredClients={filteredClients}
              isLoading={isLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              formatDate={formatDate}
              formatBudget={formatBudget}
              isCurrentlyActive={isCurrentlyActive}
              isFutureBudget={isFutureBudget}
              onEdit={tabManager.handleEditBudget}
              onDelete={(id) => deleteCustomBudgetMutation.mutate(id)}
              onToggleStatus={(id, isActive) => 
                toggleBudgetStatusMutation.mutate({ id, isActive })
              }
              onDuplicate={(budget) => duplicateBudgetMutation.mutate(budget)}
            />
          </TabsContent>

          <TabsContent value="form">
            <CustomBudgetForm
              selectedBudget={tabManager.selectedBudget ? 
                tabManager.convertBudgetToFormData(tabManager.selectedBudget) : null}
              isSubmitting={tabManager.isSubmitting}
              onSubmit={tabManager.handleFormSubmit}
              onCancel={tabManager.handleFormCancel}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
