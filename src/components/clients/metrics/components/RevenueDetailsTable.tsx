import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RevenueDetailsTableProps {
  monthStr: string; // formato "6/25"
}

interface PaymentWithClient {
  id: number;
  amount: number;
  clients: {
    company_name: string;
    first_payment_date: string;
  };
}

export const RevenueDetailsTable = ({ monthStr }: RevenueDetailsTableProps) => {
  // Converter monthStr (ex: "6/25") para período de busca
  const [month, year] = monthStr.split('/');
  const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
  const monthStart = new Date(fullYear, parseInt(month) - 1, 1);
  const monthEnd = new Date(fullYear, parseInt(month), 0);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['revenue-details', monthStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          clients!client_id(
            company_name,
            first_payment_date
          )
        `)
        .gte("reference_month", monthStart.toISOString().split('T')[0])
        .lt("reference_month", new Date(fullYear, parseInt(month), 1).toISOString().split('T')[0]);

      if (error) throw error;
      return data as PaymentWithClient[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Carregando detalhes...</div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">
          Nenhum pagamento registrado para este período
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Os valores exibidos no gráfico são baseados em contratos ativos
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>Valor Pago</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Início</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-medium">
              {payment.clients?.company_name || 'Nome não encontrado'}
            </TableCell>
            <TableCell>{formatCurrency(payment.amount)}</TableCell>
            <TableCell>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Pago
              </span>
            </TableCell>
            <TableCell>
              {payment.clients?.first_payment_date 
                ? format(new Date(payment.clients.first_payment_date), 'dd/MM/yyyy', { locale: ptBR })
                : 'Data não disponível'
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};