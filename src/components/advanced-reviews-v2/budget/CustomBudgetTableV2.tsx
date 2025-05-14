
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MoreVertical, Edit, Trash, Power } from "lucide-react";

interface CustomBudgetTableProps {
  budgets: any[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  formatDate: (date: string) => string;
  formatBudget: (value: number) => string;
  isCurrentlyActive: (budget: any) => boolean;
  isFutureBudget: (budget: any) => boolean;
  onEdit: (budget: any) => void;
  onDelete: (id: string, platform: "meta" | "google") => void;
  onToggleStatus: (id: string, platform: "meta" | "google", isActive: boolean) => void;
}

export function CustomBudgetTableV2({
  budgets,
  isLoading,
  searchTerm,
  setSearchTerm,
  formatDate,
  formatBudget,
  isCurrentlyActive,
  isFutureBudget,
  onEdit,
  onDelete,
  onToggleStatus,
}: CustomBudgetTableProps) {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "future">("all");

  // Filtrar orçamentos com base na busca e status
  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filterStatus) {
      case "active":
        return matchesSearch && isCurrentlyActive(budget);
      case "inactive":
        return matchesSearch && !budget.is_active;
      case "future":
        return matchesSearch && isFutureBudget(budget);
      default:
        return matchesSearch;
    }
  });

  // Função para confirmar exclusão
  const confirmDelete = (id: string, platform: "meta" | "google", name: string) => {
    if (confirm(`Tem certeza que deseja excluir o orçamento personalizado para ${name}?`)) {
      onDelete(id, platform);
    }
  };

  // Obter o status de um orçamento para display
  const getBudgetStatus = (budget: any) => {
    if (!budget.is_active) {
      return {
        label: "Inativo",
        variant: "outline" as const
      };
    }
    
    if (isCurrentlyActive(budget)) {
      return {
        label: "Ativo",
        variant: "success" as const
      };
    }
    
    if (isFutureBudget(budget)) {
      return {
        label: "Agendado",
        variant: "warning" as const
      };
    }
    
    return {
      label: "Expirado",
      variant: "destructive" as const
    };
  };

  // Renderizar variante da Badge
  const renderBadge = (budget: any) => {
    const status = getBudgetStatus(budget);
    
    if (status.variant === "success") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status.label}</Badge>;
    }
    
    if (status.variant === "warning") {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{status.label}</Badge>;
    }
    
    if (status.variant === "destructive") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{status.label}</Badge>;
    }
    
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("active")}
          >
            Ativos
          </Button>
          <Button
            variant={filterStatus === "future" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("future")}
          >
            Agendados
          </Button>
          <Button
            variant={filterStatus === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("inactive")}
          >
            Inativos
          </Button>
        </div>
      </div>

      {/* Tabela de orçamentos */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Estado de carregamento
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredBudgets.length === 0 ? (
              // Estado vazio
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  {searchTerm || filterStatus !== "all" 
                    ? "Nenhum orçamento encontrado para os filtros selecionados." 
                    : "Não há orçamentos personalizados cadastrados."}
                </TableCell>
              </TableRow>
            ) : (
              // Dados dos orçamentos
              filteredBudgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {budget.client?.company_name || "Cliente não encontrado"}
                  </TableCell>
                  <TableCell>
                    {budget.platform === "meta" ? "Meta Ads" : "Google Ads"}
                  </TableCell>
                  <TableCell>
                    {budget.account_name || "Todas as contas"}
                  </TableCell>
                  <TableCell>{formatBudget(budget.budget_amount)}</TableCell>
                  <TableCell>
                    {formatDate(budget.start_date)} a {formatDate(budget.end_date)}
                  </TableCell>
                  <TableCell>{renderBadge(budget)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(budget)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(
                            budget.id,
                            budget.platform,
                            !budget.is_active
                          )}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {budget.is_active ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmDelete(
                            budget.id,
                            budget.platform,
                            budget.client?.company_name || "cliente"
                          )}
                          className="text-red-600 hover:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
