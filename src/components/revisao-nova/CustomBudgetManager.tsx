
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
import { CustomBudgetCards } from "./custom-budget/CustomBudgetCards";
import { CustomBudgetCalendar } from "./custom-budget/CustomBudgetCalendar";
import { useCustomBudgets, CustomBudgetFormData } from "./hooks/useCustomBudgets";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, CalendarIcon, DownloadIcon, FileBarChart } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomBudgetManagerProps {
  viewMode?: "list" | "cards" | "calendar";
}

export const CustomBudgetManager = ({ viewMode = "list" }: CustomBudgetManagerProps) => {
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const [sortBy, setSortBy] = useState<string>("client_name");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    duplicateBudgetMutation,
    formatDate,
    formatBudget,
    isCurrentlyActive,
    isFutureBudget,
    exportToCSV
  } = useCustomBudgets({ sortBy, statusFilter });

  // Monitorar estado das mutações para atualizar dados quando necessário
  useEffect(() => {
    // Verificar se alguma mutação foi bem-sucedida para atualizar os dados
    if (addCustomBudgetMutation.isSuccess || 
        updateCustomBudgetMutation.isSuccess || 
        deleteCustomBudgetMutation.isSuccess || 
        toggleBudgetStatusMutation.isSuccess ||
        duplicateBudgetMutation.isSuccess) {
      // Invalidar consultas para recarregar os dados atualizados
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
  const convertBudgetToFormData = (budget: any): CustomBudgetFormData => {
    return {
      clientId: budget.client_id,
      budgetAmount: budget.budget_amount,
      startDate: budget.start_date,
      endDate: budget.end_date,
      description: budget.description || ""
    };
  };

  // Renderizar o conteúdo com base no modo de visualização
  const renderContent = () => {
    if (viewMode === "calendar") {
      return (
        <CustomBudgetCalendar
          filteredClients={filteredClients}
          isLoading={isLoading}
          formatBudget={formatBudget}
          onEdit={(budget) => {
            setSelectedBudget(budget);
            setSelectedTab("form");
          }}
        />
      );
    }
    
    if (viewMode === "cards") {
      return (
        <CustomBudgetCards
          filteredClients={filteredClients}
          isLoading={isLoading}
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
          onDuplicate={(budget) => duplicateBudgetMutation.mutate(budget)}
        />
      );
    }
    
    return (
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
        onDuplicate={(budget) => duplicateBudgetMutation.mutate(budget)}
      />
    );
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <CardTitle className="text-xl text-muran-dark">
            Orçamentos Personalizados Meta Ads
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportToCSV()}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedBudget(null);
                setSelectedTab("form");
              }}
              className="flex items-center gap-2 bg-muran-primary text-white hover:bg-muran-primary/80"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Orçamento</span>
            </Button>
          </div>
        </div>
        <CardDescription className="mt-1">
          Configure orçamentos com períodos personalizados para cada cliente
        </CardDescription>

        {viewMode === "list" && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_name">Nome do cliente</SelectItem>
                  <SelectItem value="budget_amount_desc">Maior orçamento</SelectItem>
                  <SelectItem value="budget_amount_asc">Menor orçamento</SelectItem>
                  <SelectItem value="start_date_desc">Data de início recente</SelectItem>
                  <SelectItem value="end_date_asc">Próximos a expirar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="scheduled">Agendados</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
            {renderContent()}
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
