import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  status?: string;
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

  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['revenue-details', monthStr],
    queryFn: async () => {
      console.log('=== Iniciando busca de receita ===');
      console.log('Parâmetros:', { monthStr, monthStart, monthEnd });
      
      try {
        // Buscar pagamentos reais com valor > 0
        const { data: payments, error: paymentsError } = await supabase
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
          .lt("reference_month", new Date(fullYear, parseInt(month), 1).toISOString().split('T')[0])
          .gt("amount", 0); // Apenas pagamentos com valor > 0

        console.log('Query de pagamentos:', { paymentsError, paymentsCount: payments?.length || 0 });
        console.log('Pagamentos encontrados:', payments);

        if (paymentsError) {
          console.error('Erro ao buscar pagamentos:', paymentsError);
          throw paymentsError;
        }

        // Verificar se há pagamentos válidos (com valor > 0 e dados completos)
        const validPayments = payments?.filter(payment => 
          payment.amount > 0 && 
          payment.clients?.company_name
        ) || [];

        console.log('Pagamentos válidos:', validPayments.length);

        if (validPayments.length > 0) {
          console.log('=== Retornando pagamentos reais ===');
          return {
            type: 'payments',
            data: validPayments as PaymentWithClient[]
          };
        }

        // Fallback: buscar clientes ativos no período
        console.log('=== Buscando clientes ativos (fallback) ===');
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .eq("status", "active");

        if (clientsError) {
          console.error('Erro ao buscar clientes:', clientsError);
          throw clientsError;
        }

        console.log('Total de clientes ativos:', clients?.length || 0);

        // Filtrar clientes ativos no mês específico
        const activeClients = clients?.filter(client => 
          isClientActiveInMonth(client, monthStart, new Date(fullYear, parseInt(month), 0))
        ) || [];

        console.log('Clientes ativos no mês:', activeClients.length);

        if (activeClients.length === 0) {
          console.log('=== Nenhum cliente ativo encontrado ===');
          return {
            type: 'estimated',
            data: []
          };
        }

        console.log('=== Retornando receita estimada ===');
        return {
          type: 'estimated',
          data: activeClients.map(client => ({
            id: client.id,
            amount: client.contract_value || 0,
            status: 'estimado',
            clients: {
              company_name: client.company_name,
              first_payment_date: client.first_payment_date
            }
          }))
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
          Nenhum dado de receita encontrado para este período
        </div>
      </div>
    );
  }

  const { type, data } = revenueData;

  return (
    <div className="space-y-4">
      {type === 'estimated' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="font-medium">Receita Estimada</span>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Valores baseados nos contratos ativos (sem pagamentos registrados para este mês)
          </p>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>{type === 'payments' ? 'Valor Pago' : 'Valor do Contrato'}</TableHead>
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
                  type === 'payments' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {type === 'payments' ? 'Pago' : 'Estimado'}
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
      </Table>
    </div>
  );
};