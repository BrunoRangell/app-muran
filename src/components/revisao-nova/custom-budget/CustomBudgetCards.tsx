
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClientWithBudgets, CustomBudget } from "../hooks/useCustomBudgets";
import {
  Calendar,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash,
  Copy
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface CustomBudgetCardsProps {
  clientsWithBudgets: ClientWithBudgets[];
  onEdit: (budget: CustomBudget) => void;
  onDelete: (budget: CustomBudget) => void;
  onToggleStatus: (budget: CustomBudget, newStatus: boolean) => void;
  onDuplicate: (budget: CustomBudget) => void;
  onView: (budget: CustomBudget) => void;
  formatDate: (date: string) => string;
  formatBudget: (amount: number) => string;
  isCurrentlyActive: (budget: CustomBudget) => boolean;
}

export function CustomBudgetCards({
  clientsWithBudgets,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onView,
  formatDate,
  formatBudget,
  isCurrentlyActive
}: CustomBudgetCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clientsWithBudgets.flatMap(({ client, budgets }) =>
        budgets.map((budget) => (
          <Card key={budget.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{client.company_name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {budget.description || "Sem descrição"}
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={
                          budget.isActive
                            ? isCurrentlyActive(budget)
                              ? "success"
                              : "warning"
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
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-2">
              <div className="space-y-2">
                <div className="flex items-center text-lg font-semibold">
                  <DollarSign className="w-5 h-5 mr-1 text-[#ff6e00]" />
                  {formatBudget(budget.budget_amount)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {formatDate(budget.start_date)} a {formatDate(budget.end_date)}
                  </span>
                </div>
                {budget.account_id && (
                  <Badge variant="secondary" className="mt-2">
                    Conta específica
                  </Badge>
                )}
              </div>
              <Separator />
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => onView(budget)}>
                <Eye className="h-4 w-4 mr-1" /> Detalhes
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
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
            </CardFooter>
          </Card>
        ))
      )}
      
      {clientsWithBudgets.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed">
          <div className="text-gray-500 text-center">
            <h3 className="text-lg font-medium mb-1">Nenhum orçamento personalizado</h3>
            <p className="text-sm">Crie um novo orçamento personalizado para começar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
