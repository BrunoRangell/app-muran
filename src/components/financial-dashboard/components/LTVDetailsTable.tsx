import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseMonthString } from "@/utils/monthParser";
import { InfoIcon } from "lucide-react";

interface LTVDetailsTableProps {
  monthStr: string; // formato "Jan/25"
}

interface ClientLTV {
  id: string;
  company_name: string;
  first_payment_date: string;
  total_payments: number;
  ltv: number;
}

export const LTVDetailsTable = ({ monthStr }: LTVDetailsTableProps) => {
  // Parse monthStr (example: "Jan/25" or "6/25")
  const { monthStart, monthEnd, month, fullYear } = parseMonthString(monthStr);
  const referenceDate = monthEnd; // Last day of the month

  const { data: clientsLTV, isLoading, error } = useQuery({
    queryKey: ['ltv-details', monthStr],
    queryFn: async () => {
      // Calcular período de 12 meses baseado no mês de referência
      const endOfPeriod = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0); // Último dia do mês
      const startOfPeriod = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 11, 1); // 12 meses atrás
      
      const startDateStr = startOfPeriod.toISOString().split('T')[0];
      const endDateStr = endOfPeriod.toISOString().split('T')[0];

      console.log(`🔍 LTVDetailsTable - Período de 12 meses:`, {
        monthStr,
        startDate: startDateStr,
        endDate: endDateStr
      });

      // Buscar todos os clientes
      const { data: allClients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          first_payment_date,
          last_payment_date,
          status
        `);

      if (clientsError) throw clientsError;

      // Buscar payments APENAS dos últimos 12 meses (mesmo critério do gráfico)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("client_id, amount, reference_month")
        .gte("reference_month", startDateStr)
        .lte("reference_month", endDateStr);

      if (paymentsError) throw paymentsError;

      console.log(`💰 Payments encontrados no período de 12 meses: ${paymentsData?.length || 0}`);

      // Agrupar payments por cliente (APENAS dos últimos 12 meses)
      const paymentsByClient: Record<string, number> = {};
      (paymentsData || []).forEach(payment => {
        const clientId = payment.client_id;
        if (clientId && Number(payment.amount) > 0) {
          paymentsByClient[clientId] = (paymentsByClient[clientId] || 0) + Number(payment.amount);
        }
      });

      // Filtrar clientes que estiveram ativos no período de 12 meses
      const activeClientsInPeriod = (allClients || []).filter(client => {
        const firstPaymentDate = new Date(client.first_payment_date);
        const lastPaymentDate = client.last_payment_date ? new Date(client.last_payment_date) : new Date();
        
        // Cliente esteve ativo se começou antes/durante o período E não cancelou antes do período
        return firstPaymentDate <= endOfPeriod && lastPaymentDate >= startOfPeriod;
      });

      // Calcular LTV baseado nos payments dos últimos 12 meses (igual ao gráfico)
      const clientsWithLTV: ClientLTV[] = activeClientsInPeriod.map(client => {
        const paymentsLast12Months = paymentsByClient[client.id] || 0;
        
        return {
          id: client.id,
          company_name: client.company_name,
          first_payment_date: client.first_payment_date,
          total_payments: paymentsLast12Months, // Agora são payments dos últimos 12 meses
          ltv: paymentsLast12Months // LTV individual = payments dos últimos 12 meses
        };
      }).filter(client => client.ltv > 0); // Só mostrar clientes que fizeram payments no período

      // Ordenar por LTV decrescente
      clientsWithLTV.sort((a, b) => b.ltv - a.ltv);

      // LTV médio = soma dos payments dos últimos 12 meses / clientes com payments > 0
      const totalPaymentsLast12Months = clientsWithLTV.reduce((sum, client) => sum + client.ltv, 0);
      const averageLTV = clientsWithLTV.length > 0 ? totalPaymentsLast12Months / clientsWithLTV.length : 0;
        
      console.log(`📊 LTVDetailsTable UNIFICADO para ${monthStr}:`, {
        periodo: `${startDateStr} a ${endDateStr}`,
        clientesAtivosNoPeriodo: activeClientsInPeriod.length,
        clientesComPayments: clientsWithLTV.length,
        totalPaymentsLast12Months: totalPaymentsLast12Months.toFixed(2),
        ltvMedio: averageLTV.toFixed(2)
      });

      return {
        clients: clientsWithLTV,
        averageLTV,
        totalActiveClients: clientsWithLTV.length,
        period: `${startDateStr} a ${endDateStr}`
      };
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

  if (!clientsLTV || clientsLTV.clients.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">
          Nenhum cliente encontrado para este período
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do LTV */}
      <div className="bg-card p-4 rounded-lg border">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-semibold text-lg">LTV Médio - {monthStr}</h3>
              <p className="text-sm text-muted-foreground">
                Baseado em {clientsLTV.totalActiveClients} clientes com payments nos últimos 12 meses
              </p>
              {clientsLTV.period && (
                <p className="text-xs text-muted-foreground">
                  Período: {clientsLTV.period}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/50 p-3 rounded-lg">
                <span className="text-sm text-muted-foreground block">LTV Médio:</span>
                <div className="text-2xl font-bold text-primary">{formatCurrency(clientsLTV.averageLTV)}</div>
              </div>
              <div className="bg-background/50 p-3 rounded-lg">
                <span className="text-sm text-muted-foreground block">Fórmula:</span>
                <div className="text-sm font-medium">Payments dos últimos 12 meses ÷ Clientes ativos no período</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Clientes Ativos */}
      <div>
        <h4 className="font-medium mb-3">Clientes Ativos em {monthStr}</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Payments (12 meses)</TableHead>
              <TableHead className="text-right">LTV Individual</TableHead>
              <TableHead>Data de Início</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsLTV.clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.company_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(client.total_payments)}</TableCell>
                <TableCell className="text-right font-medium text-primary">{formatCurrency(client.ltv)}</TableCell>
                <TableCell>
                  {format(new Date(client.first_payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};