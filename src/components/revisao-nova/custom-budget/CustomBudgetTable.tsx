import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  Edit,
  Eye,
  MoreHorizontal,
  Power,
  PowerOff,
  Search,
  Trash
} from "lucide-react";
import { CustomBudget, ClientWithBudgets } from "../hooks/useCustomBudgets";

interface CustomBudgetTableProps {
  clientsWithBudgets: ClientWithBudgets[];
  onEdit: (budget: CustomBudget) => void;
  onDelete: (budget: CustomBudget) => void;
  onToggleStatus: (budget: CustomBudget, newStatus: boolean) => void;
  onDuplicate: (budget: CustomBudget) => void;
  onView: (budget: CustomBudget) => void;
  formatDate: (date: string) => string;
  formatBudget: (amount: number) => string;
  isCurrentlyActive: (budget: CustomBudget) => boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CustomBudgetTable({
  clientsWithBudgets,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onView,
  formatDate,
  formatBudget,
  isCurrentlyActive,
  searchTerm,
  onSearchChange
}: CustomBudgetTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Buscar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
          startAdornment={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRows.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Selecionar todos os orçamentos visíveis
                      const allIds = clientsWithBudgets.flatMap(cwb => 
                        cwb.budgets.map(budget => budget.id)
                      );
                      setSelectedRows(allIds);
                    } else {
                      setSelectedRows([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsWithBudgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum orçamento personalizado encontrado
                </TableCell>
              </TableRow>
            ) : (
              clientsWithBudgets.flatMap(({ client, budgets }) =>
                budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(budget.id)}
                        onCheckedChange={(checked) => handleSelect(budget.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{client.company_name}</TableCell>
                    <TableCell>{formatBudget(budget.budget_amount)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDate(budget.start_date)}</span>
                        <span className="text-gray-500 text-sm">até {formatDate(budget.end_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant={
                                budget.isActive
                                  ? isCurrentlyActive(budget)
                                    ? "success"
                                    : "secondary"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() => onToggleStatus(budget, !budget.isActive)}
                            >
                              {budget.isActive
                                ? isCurrentlyActive(budget)
                                  ? "Ativo"
                                  : "Pendente"
                                : "Inativo"}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {budget.isActive
                              ? isCurrentlyActive(budget)
                                ? "Orçamento ativo e no período válido"
                                : "Orçamento ativo mas fora do período atual"
                              : "Orçamento inativo"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {budget.account_id ? (
                        <Badge variant="secondary">Conta específica</Badge>
                      ) : (
                        <Badge variant="outline">Geral</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onView(budget)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver detalhes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(budget)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(budget)}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Duplicar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(budget, !budget.isActive)}
                          >
                            {budget.isActive ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                <span>Desativar</span>
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                <span>Ativar</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(budget)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
