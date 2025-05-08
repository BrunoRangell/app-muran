
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomBudgetTable } from "./custom-budget/CustomBudgetTable";
import { CustomBudgetCards } from "./custom-budget/CustomBudgetCards";
import { CustomBudgetCalendar } from "./custom-budget/CustomBudgetCalendar";
import { CustomBudgetForm } from "./custom-budget/CustomBudgetForm";
import { useCustomBudgets, CustomBudgetFormData } from "./hooks/useCustomBudgets";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, CalendarIcon, DownloadIcon, FileBarChart, ChevronDown, Search, BarChart3, Calendar, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CustomBudgetManagerProps {
  viewMode?: "list" | "cards" | "calendar";
}

export const CustomBudgetManager = ({ viewMode = "list" }: CustomBudgetManagerProps) => {
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const [sortBy, setSortBy] = useState<string>("client_name");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [displayMode, setDisplayMode] = useState<"list" | "cards" | "calendar">(viewMode);
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
    exportToCSV,
    getBudgetStats
  } = useCustomBudgets({ sortBy, statusFilter, platformFilter });

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
  const convertBudgetToFormData = (budget: any): CustomBudgetFormData => {
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

  // Obter estatísticas de orçamentos
  const budgetStats = getBudgetStats();

  // Renderizar o conteúdo com base no modo de visualização
  const renderContent = () => {
    if (displayMode === "calendar") {
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
    
    if (displayMode === "cards") {
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
            Orçamentos Personalizados
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
          Configure orçamentos com períodos personalizados para Meta e Google Ads
        </CardDescription>

        {/* Estatísticas de orçamento */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <Card className="bg-gray-50 border-none">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-xl font-bold">{budgetStats.total}</span>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-none">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-sm text-gray-500">Ativos</span>
              <span className="text-xl font-bold text-green-600">{budgetStats.active}</span>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-none">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-sm text-gray-500">Agendados</span>
              <span className="text-xl font-bold text-blue-600">{budgetStats.scheduled}</span>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-none">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-sm text-gray-500">Meta Ads</span>
              <span className="text-xl font-bold text-blue-600">{budgetStats.meta}</span>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-none">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-sm text-gray-500">Google Ads</span>
              <span className="text-xl font-bold text-red-600">{budgetStats.google}</span>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas plataformas</SelectItem>
                <SelectItem value="meta">
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-blue-500">Meta</Badge>
                    Meta Ads
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-red-500">Google</Badge>
                    Google Ads
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="recurring">Recorrentes</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ordenar
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("client_name")}>
                  Nome do cliente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("budget_amount_desc")}>
                  Maior orçamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("budget_amount_asc")}>
                  Menor orçamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("start_date_desc")}>
                  Data de início (recente)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("end_date_asc")}>
                  Próximos a expirar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("platform")}>
                  Plataforma
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center border rounded-md">
            <Button 
              variant={displayMode === "list" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-none rounded-l-md"
              onClick={() => setDisplayMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={displayMode === "cards" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-none"
              onClick={() => setDisplayMode("cards")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={displayMode === "calendar" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-none rounded-r-md"
              onClick={() => setDisplayMode("calendar")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
