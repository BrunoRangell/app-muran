
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { Check, X, Calendar, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/formatters";

interface PaymentsTableProps {
  payments: Payment[] | undefined;
  isLoading: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Vencimento
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Observações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments?.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.clients?.company_name}</TableCell>
              <TableCell>{formatDate(payment.due_date)}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {payment.status === 'completed' ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        Pago
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        Pendente
                      </span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>{payment.notes || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
