
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Edit, Trash2 } from "lucide-react";

interface CustomBudget {
  id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  description?: string;
  platform: string;
  is_active: boolean;
}

interface CustomBudgetTableProps {
  budgets: CustomBudget[];
  onEdit: (budget: CustomBudget) => void;
  onDelete: (budgetId: string) => void;
}

export const CustomBudgetTable = ({ budgets, onEdit, onDelete }: CustomBudgetTableProps) => {
  if (!budgets.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum orçamento personalizado encontrado
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Período</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Plataforma</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {budgets.map((budget) => (
          <TableRow key={budget.id}>
            <TableCell>
              <div className="text-sm">
                <div>{formatDate(budget.start_date)}</div>
                <div className="text-muted-foreground">até {formatDate(budget.end_date)}</div>
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {formatCurrency(budget.budget_amount)}
            </TableCell>
            <TableCell>
              <Badge variant={budget.platform === 'meta' ? 'default' : 'secondary'}>
                {budget.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={budget.is_active ? 'success' : 'secondary'}>
                {budget.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {budget.description || '-'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(budget)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(budget.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
