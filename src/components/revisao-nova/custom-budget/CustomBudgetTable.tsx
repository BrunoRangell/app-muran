
import React from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomBudgetTableProps {
  filteredClients: any[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  formatDate: (dateString: string) => string;
  formatBudget: (value: number) => string;
  isCurrentlyActive: (budget: any) => boolean;
  isFutureBudget: (budget: any) => boolean;
  onEdit: (budget: any) => void;
  onDelete: (budgetInfo: {id: string, platform: string}) => void;
  onToggleStatus: (id: string, isActive: boolean, platform: string) => void;
}

export function CustomBudgetTable({
  filteredClients,
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
  // Renderizar esqueleto de carregamento
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
        </div>
        <div className="border rounded-md">
          <div className="p-2 border-b bg-gray-50">
            <Skeleton className="h-6 w-full" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Tabela de orçamentos personalizados */}
      <div className="rounded-md border overflow-hidden">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[20%]">Cliente</TableHead>
              <TableHead className="w-[15%]">Plataforma</TableHead>
              <TableHead className="w-[15%]">Valor</TableHead>
              <TableHead className="w-[15%]">Período</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[20%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum orçamento personalizado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <React.Fragment key={client.id}>
                  {client.custom_budgets && client.custom_budgets.length > 0 ? (
                    client.custom_budgets.map((budget: any) => {
                      const isActive = isCurrentlyActive(budget);
                      const isFuture = isFutureBudget(budget);
                      
                      return (
                        <TableRow key={budget.id}>
                          <TableCell className="font-medium">
                            {client.company_name}
                            {client.status !== "active" && (
                              <Badge variant="outline" className="ml-2 bg-gray-100">
                                {client.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={budget.platform === "meta" ? "default" : "secondary"} className={`${
                              budget.platform === "meta" 
                                ? "bg-blue-500 hover:bg-blue-500/80" 
                                : "bg-red-500 hover:bg-red-500/80"
                            }`}>
                              {budget.platform === "meta" ? "Meta Ads" : "Google Ads"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatBudget(budget.budget_amount)}</TableCell>
                          <TableCell>
                            {formatDate(budget.start_date)} a {formatDate(budget.end_date)}
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <Badge className="bg-green-500 hover:bg-green-500/80">
                                Ativo
                              </Badge>
                            ) : isFuture ? (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                                Futuro
                              </Badge>
                            ) : !budget.is_active ? (
                              <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
                                Desativado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                                Expirado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => onEdit(budget)}
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir orçamento personalizado</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este orçamento personalizado? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDelete({id: budget.id, platform: budget.platform})}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button
                                onClick={() => onToggleStatus(budget.id, !budget.is_active, budget.platform)}
                                variant="outline"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  budget.is_active
                                    ? "text-orange-500 hover:text-orange-600"
                                    : "text-green-500 hover:text-green-600"
                                }`}
                              >
                                {budget.is_active ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : null}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
