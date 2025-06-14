import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeProps } from "@/utils/unifiedFormatters";
import { UnifiedEmptyState } from "@/components/common/UnifiedEmptyState";

interface CustomBudget {
  id: string;
  client_id: string;
  platform: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
  clients?: {
    company_name: string;
  };
}

interface CustomBudgetTableProps {
  budgets: CustomBudget[];
  onEdit: (budget: CustomBudget) => void;
  onDelete: (budget: CustomBudget) => void;
  onToggleStatus: (budget: CustomBudget) => void;
}

export function CustomBudgetTable({ budgets, onEdit, onDelete, onToggleStatus }: CustomBudgetTableProps) {
  if (budgets.length === 0) {
    return (
      <UnifiedEmptyState
        title="Nenhum orçamento personalizado encontrado"
        description="Crie orçamentos personalizados para períodos específicos dos seus clientes."
        size="md"
      />
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => {
            const platformProps = getStatusBadgeProps(budget.platform, 'platform');
            const statusProps = getStatusBadgeProps(budget.is_active ? 'ativo' : 'inativo', 'activity');

            return (
              <TableRow key={budget.id}>
                <TableCell className="font-medium">
                  {budget.clients?.company_name || 'Cliente não encontrado'}
                </TableCell>
                <TableCell>
                  <Badge {...platformProps}>
                    {platformProps.text}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(budget.budget_amount)}
                </TableCell>
                <TableCell>
                  {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                </TableCell>
                <TableCell>
                  <Badge {...statusProps}>
                    {statusProps.text}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {budget.description || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleStatus(budget)}
                      title={budget.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {budget.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(budget)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(budget)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
