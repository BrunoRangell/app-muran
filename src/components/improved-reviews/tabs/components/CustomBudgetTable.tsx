
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateBr } from "@/utils/dateFormatter";

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
      <div className="text-center py-12 text-gray-500">
        <div className="mb-4">
          <svg className="h-16 w-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6m-6-4h6m2 4l1.5 1.5M18 12h3m-3 0v3m0-3V9" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhum orçamento personalizado encontrado</h3>
        <p className="text-sm">Crie orçamentos personalizados para períodos específicos dos seus clientes.</p>
      </div>
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
          {budgets.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium">
                {budget.clients?.company_name || 'Cliente não encontrado'}
              </TableCell>
              <TableCell>
                <Badge 
                  className={budget.platform === 'meta' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }
                >
                  {budget.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(budget.budget_amount)}
              </TableCell>
              <TableCell>
                {formatDateBr(budget.start_date)} - {formatDateBr(budget.end_date)}
              </TableCell>
              <TableCell>
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const isExpired = budget.end_date < today;
                  
                  if (isExpired) {
                    return <Badge variant="destructive">Expirado</Badge>;
                  }
                  
                  return (
                    <Badge variant={budget.is_active ? 'success' : 'secondary'}>
                      {budget.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  );
                })()}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
