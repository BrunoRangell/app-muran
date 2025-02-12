
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/formatters";

interface Payment {
  id: string;
  amount: number;
  net_amount: number;
  reference_month: string;
  payment_date: string;
  notes: string | null;
  clients: {
    company_name: string;
  };
}

interface PaymentsTableProps {
  payments: Payment[];
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
                Mês de Referência
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data do Pagamento
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Bruto
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Líquido
              </div>
            </TableHead>
            <TableHead>Observações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments?.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.clients?.company_name}</TableCell>
              <TableCell>{formatDate(payment.reference_month)}</TableCell>
              <TableCell>{formatDate(payment.payment_date)}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{formatCurrency(payment.net_amount)}</TableCell>
              <TableCell>{payment.notes || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
