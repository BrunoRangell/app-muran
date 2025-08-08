import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Client } from "../../types";
import { isClientActiveInMonth } from "../utils/dateFilters";

interface RevenueDetailsTableProps {
  monthStr: string; // formato "6/25"
}

interface PaymentWithClient {
  id: number;
  amount: number;
  client_id: string;
  clients: {
    company_name: string;
    first_payment_date: string;
    status: string;
  };
}

export const RevenueDetailsTable = ({ monthStr }: RevenueDetailsTableProps) => {
  // Converter monthStr (ex: "6/25") para período de busca
  const [month, year] = monthStr.split('/');
  const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
  const monthStart = new Date(fullYear, parseInt(month) - 1, 1);
  const monthEnd = new Date(fullYear, parseInt(month), 0);

  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['revenue-details', monthStr],
    queryFn: async () => {
      console.log('=== Iniciando busca de receita ===');
      console.log('Parâmetros:', { monthStr, monthStart, monthEnd });
      
      try {
        // Buscar apenas pagamentos reais com valor > 0
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select(`
            id,
            amount,
            client_id,
            clients:client_id(
              company_name,
              first_payment_date,
              status
            )
          `)
          .gte("reference_month", monthStart.toISOString().split('T')[0])
          .lt("reference_month", new Date(fullYear, parseInt(month), 1).toISOString().split('T')[0])
          .gt("amount", 0); // Apenas pagamentos com valor > 0

        console.log('Query de pagamentos:', { paymentsError, paymentsCount: payments?.length || 0 });

        if (paymentsError) {
          console.error('Erro ao buscar pagamentos:', paymentsError);
          throw paymentsError;
        }

        // Filtrar pagamentos válidos
        const validPayments = payments?.filter(payment => 
          payment.amount > 0 && 
          payment.clients?.company_name
        ) || [];

        console.log('Pagamentos encontrados:', validPayments.length);

        return {
          type: 'payments',
          data: validPayments as PaymentWithClient[]
        };

      } catch (error) {
        console.error('=== Erro na busca de receita ===', error);
        throw error;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Carregando detalhes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-red-600">
          Erro ao carregar dados: {error.message}
        </div>
      </div>
    );
  }

  if (!revenueData || !revenueData.data || revenueData.data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">
          Nenhum pagamento registrado para este período
        </div>
      </div>
    );
  }

  const { data } = revenueData;

  // Calcular total dos pagamentos
  const total = data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-4">
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
          {data.map((item: any, index: number) => (
            <TableRow key={item.id || index}>
              <TableCell className="font-medium">
                {item.clients?.company_name || 'Nome não encontrado'}
              </TableCell>
              <TableCell>{formatCurrency(item.amount)}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.clients?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.clients?.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </TableCell>
              <TableCell>
                {item.clients?.first_payment_date 
                  ? format(new Date(item.clients.first_payment_date), 'dd/MM/yyyy', { locale: ptBR })
                  : 'Data não disponível'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">TOTAL</TableCell>
            <TableCell className="font-bold">{formatCurrency(total)}</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};