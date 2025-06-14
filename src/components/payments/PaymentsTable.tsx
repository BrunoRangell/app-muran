
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Edit, Trash2 } from "lucide-react";
import { Payment } from "@/types/payment";

interface PaymentsTableProps {
  payments: Payment[];
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
  isLoading?: boolean;
}

export const PaymentsTable = ({ payments, onEdit, onDelete, isLoading }: PaymentsTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum pagamento encontrado
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Mês de Referência</TableHead>
          <TableHead>Data do Pagamento</TableHead>
          <TableHead>Observações</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              <div className="font-medium">
                {payment.clients?.company_name || 'Cliente não encontrado'}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {formatCurrency(payment.amount)}
            </TableCell>
            <TableCell>
              {formatDate(payment.reference_month)}
            </TableCell>
            <TableCell>
              {formatDate(payment.created_at)}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {payment.notes || '-'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(payment)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(payment.id)}
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
