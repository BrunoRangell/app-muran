
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { Check, X, Calendar, DollarSign, AlertTriangle, RotateCcw, Ban } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/formatters";

interface PaymentsTableProps {
  payments: Payment[] | undefined;
  isLoading: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'CONFIRMED':
        return <Check className="h-4 w-4 text-blue-500" />;
      case 'PENDING':
        return <X className="h-4 w-4 text-orange-500" />;
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'REFUNDED':
        return <RotateCcw className="h-4 w-4 text-purple-500" />;
      case 'CANCELLED':
        return <Ban className="h-4 w-4 text-gray-500" />;
      default:
        return <X className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return { text: 'Recebido', color: 'text-green-500' };
      case 'CONFIRMED':
        return { text: 'Confirmado', color: 'text-blue-500' };
      case 'PENDING':
        return { text: 'Aguardando', color: 'text-orange-500' };
      case 'OVERDUE':
        return { text: 'Atrasado', color: 'text-red-500' };
      case 'REFUNDED':
        return { text: 'Reembolsado', color: 'text-purple-500' };
      case 'CANCELLED':
        return { text: 'Cancelado', color: 'text-gray-500' };
      default:
        return { text: 'Desconhecido', color: 'text-gray-500' };
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data do Pagamento
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
          {payments?.map((payment) => {
            const status = getStatusText(payment.status);
            return (
              <TableRow key={payment.id}>
                <TableCell>{payment.clients?.company_name}</TableCell>
                <TableCell>{formatDate(payment.payment_date || '')}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{payment.notes || '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
