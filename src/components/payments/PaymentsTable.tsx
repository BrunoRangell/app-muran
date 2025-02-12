
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
  client_id: string;
}

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  // Buscar total de pagamentos por cliente
  const { data: clientTotals } = useQuery({
    queryKey: ['client-payment-totals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('client_id, amount')
        .eq('status', 'RECEIVED');

      if (error) throw error;

      // Calcular o total por cliente
      const totals = data.reduce((acc: Record<string, number>, payment) => {
        acc[payment.client_id] = (acc[payment.client_id] || 0) + payment.amount;
        return acc;
      }, {});

      return totals;
    }
  });

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
            <TableHead>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Recebido
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
              <TableCell>
                {formatCurrency(clientTotals?.[payment.client_id] || 0)}
              </TableCell>
              <TableCell>{payment.notes || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
