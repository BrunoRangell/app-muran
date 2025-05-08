
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, RefreshCcw, Download } from "lucide-react";
import { CustomBudget, useCustomBudgets, ClientWithBudgets, CustomBudgetFormData } from "./hooks/useCustomBudgets";
import { CustomBudgetTable } from "./custom-budget/CustomBudgetTable";
import { CustomBudgetCards } from "./custom-budget/CustomBudgetCards";
import { CustomBudgetCalendar } from "./custom-budget/CustomBudgetCalendar";
import { CustomBudgetForm } from "./custom-budget/CustomBudgetForm";

interface CustomBudgetManagerProps {
  viewMode?: string;
}

export function CustomBudgetManager({ viewMode = "table" }: CustomBudgetManagerProps) {
  // Estado local
  const [selectedTab, setSelectedTab] = useState<string>(viewMode);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<CustomBudget | null>(null);

  // Usar o hook customizado
  const {
    isLoading,
    error,
    refetch,
    activeClients,
    filteredClients,
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
    exportToCSV,
    getBudgetStats
  } = useCustomBudgets({ sortBy: "date" });

  // Funções para gerenciar os orçamentos
  const handleAddBudget = () => {
    setSelectedBudget(null);
    setIsFormDialogOpen(true);
  };

  const handleEditBudget = (budget: CustomBudget) => {
    setSelectedBudget(budget);
    setIsFormDialogOpen(true);
  };

  const handleViewBudget = (budget: CustomBudget) => {
    setSelectedBudget(budget);
    // Aqui poderíamos mostrar uma visualização detalhada do orçamento
  };

  const handleSaveBudget = (budgetData: CustomBudgetFormData) => {
    if (selectedBudget) {
      updateCustomBudgetMutation.mutate({
        id: selectedBudget.id,
        client_id: budgetData.clientId,
        budget_amount: budgetData.budgetAmount,
        start_date: budgetData.startDate,
        end_date: budgetData.endDate,
        isActive: true,
        description: budgetData.description,
        platform: budgetData.platform
      });
    } else {
      addCustomBudgetMutation.mutate({
        client_id: budgetData.clientId,
        budget_amount: budgetData.budgetAmount,
        start_date: budgetData.startDate,
        end_date: budgetData.endDate,
        isActive: true,
        description: budgetData.description,
        platform: budgetData.platform
      } as Omit<CustomBudget, 'id' | 'created_at' | 'updated_at'>);
    }
    setIsFormDialogOpen(false);
  };

  const handleDeleteBudget = (budget: CustomBudget) => {
    setBudgetToDelete(budget);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBudget = () => {
    if (budgetToDelete) {
      deleteCustomBudgetMutation.mutate(budgetToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setBudgetToDelete(null);
  };

  const handleToggleBudgetStatus = (budget: CustomBudget, newStatus: boolean) => {
    toggleBudgetStatusMutation.mutate({ id: budget.id, isActive: newStatus });
  };

  const handleDuplicateBudget = (budget: CustomBudget) => {
    duplicateBudgetMutation.mutate(budget);
  };

  // Estatísticas dos orçamentos
  const stats = getBudgetStats();

  // Verificar carregamento e erro
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Ocorreu um erro ao carregar os orçamentos: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orçamentos Personalizados</h2>
          <p className="text-muted-foreground">
            Gerencie orçamentos personalizados para clientes específicos e períodos especiais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleAddBudget} className="bg-[#ff6e00] hover:bg-[#e66300] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Orçamentos</CardTitle>
            <CardDescription>Todos os orçamentos cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalBudgets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Orçamentos Ativos</CardTitle>
            <CardDescription>Orçamentos no período atual</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeBudgets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Clientes com Orçamentos</CardTitle>
            <CardDescription>Clientes usando orçamento personalizado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.clientsWithBudget}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valor Total</CardTitle>
            <CardDescription>Soma de todos os orçamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatBudget(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <CustomBudgetTable
            clientsWithBudgets={filteredClients as ClientWithBudgets[]}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
            onToggleStatus={handleToggleBudgetStatus}
            onDuplicate={handleDuplicateBudget}
            onView={handleViewBudget}
            formatDate={formatDate}
            formatBudget={formatBudget}
            isCurrentlyActive={isCurrentlyActive}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </TabsContent>
        
        <TabsContent value="cards">
          <CustomBudgetCards
            clientsWithBudgets={filteredClients as ClientWithBudgets[]}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
            onToggleStatus={handleToggleBudgetStatus}
            onDuplicate={handleDuplicateBudget}
            onView={handleViewBudget}
            formatDate={formatDate}
            formatBudget={formatBudget}
            isCurrentlyActive={isCurrentlyActive}
          />
        </TabsContent>
        
        <TabsContent value="calendar">
          <CustomBudgetCalendar
            clientsWithBudgets={filteredClients as ClientWithBudgets[]}
            onSelectBudget={handleViewBudget}
          />
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento personalizado?
              {budgetToDelete && (
                <p className="font-medium mt-2">
                  {formatBudget(budgetToDelete.budget_amount)} - Período: {formatDate(budgetToDelete.start_date)} a {formatDate(budgetToDelete.end_date)}
                </p>
              )}
              <p className="text-red-500 mt-2">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBudget}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteCustomBudgetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para formulário de criação/edição */}
      <AlertDialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <AlertDialogContent className="max-w-md sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedBudget ? "Editar Orçamento" : "Novo Orçamento"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <CustomBudgetForm
            selectedBudget={selectedBudget ? 
              {
                clientId: selectedBudget.client_id,
                budgetAmount: selectedBudget.budget_amount,
                startDate: selectedBudget.start_date,
                endDate: selectedBudget.end_date,
                platform: selectedBudget.platform as 'meta' | 'google',
                description: selectedBudget.description
              } : null
            }
            isSubmitting={addCustomBudgetMutation.isPending || updateCustomBudgetMutation.isPending}
            onSubmit={handleSaveBudget}
            onCancel={() => setIsFormDialogOpen(false)}
            clients={activeClients}
          />
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
