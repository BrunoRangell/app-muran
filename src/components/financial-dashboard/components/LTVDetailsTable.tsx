import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { format, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseMonthString } from "@/utils/monthParser";

interface LTVDetailsTableProps {
  monthStr: string; // formato "Jan/25"
}

interface ClientLTV {
  id: string;
  company_name: string;
  first_payment_date: string;
  last_payment_date: string | null;
  status: string;
  contract_value: number;
  totalPaid: number;
  monthsActive: number;
  ltv: number;
}

export const LTVDetailsTable = ({ monthStr }: LTVDetailsTableProps) => {
  // Parse monthStr (example: "Jan/25" or "6/25")
  const { monthEnd } = parseMonthString(monthStr);
  const referenceDate = monthEnd; // Last day of the month

  const { data: clientsLTV, isLoading, error } = useQuery({
    queryKey: ['ltv-details', monthStr],
    queryFn: async () => {
      // Buscar clientes ativos até a data de referência
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          first_payment_date,
          last_payment_date,
          status,
          contract_value
        `)
        .lte("first_payment_date", referenceDate.toISOString().split('T')[0]);

      if (clientsError) throw clientsError;

      // Para cada cliente, calcular o LTV
      const clientsWithLTV: ClientLTV[] = [];

      for (const client of clients || []) {
        // Buscar todos os pagamentos do cliente
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select("amount, reference_month")
          .eq("client_id", client.id)
          .lte("reference_month", referenceDate.toISOString().split('T')[0]);

        if (paymentsError) continue;

        const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        
        // Calcular meses ativos
        const startDate = new Date(client.first_payment_date);
        const endDate = client.status === 'active' 
          ? referenceDate 
          : client.last_payment_date 
            ? new Date(client.last_payment_date)
            : referenceDate;
        
        const monthsActive = Math.max(1, differenceInMonths(endDate, startDate) + 1);
        
        // Calculate LTV using the same formula as financialCalculations.ts
        // LTV = contract_value * monthsActive (representing ticket médio * retenção)
        const ltv = client.contract_value * monthsActive;

        clientsWithLTV.push({
          id: client.id,
          company_name: client.company_name,
          first_payment_date: client.first_payment_date,
          last_payment_date: client.last_payment_date,
          status: client.status,
          contract_value: client.contract_value,
          totalPaid,
          monthsActive,
          ltv
        });
      }

      // Ordenar por LTV decrescente
      clientsWithLTV.sort((a, b) => b.ltv - a.ltv);

      const averageLTV = clientsWithLTV.length > 0 
        ? clientsWithLTV.reduce((sum, client) => sum + client.ltv, 0) / clientsWithLTV.length 
        : 0;

      return {
        clients: clientsWithLTV,
        averageLTV,
        totalLTV: clientsWithLTV.reduce((sum, client) => sum + client.ltv, 0)
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
        <h3 className="font-semibold mb-2">Resumo do LTV</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">LTV Médio:</span>
            <div className="font-medium text-primary">{formatCurrency(clientsLTV.averageLTV)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Total de Clientes:</span>
            <div className="font-medium">{clientsLTV.clients.length}</div>
          </div>
          <div>
            <span className="text-muted-foreground">LTV Total:</span>
            <div className="font-medium">{formatCurrency(clientsLTV.totalLTV)}</div>
          </div>
        </div>
      </div>

      {/* Tabela de LTV por Cliente */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total Pago</TableHead>
            <TableHead className="text-center">Meses Ativos</TableHead>
            <TableHead className="text-right">LTV</TableHead>
            <TableHead>Início</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientsLTV.clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.company_name}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(client.totalPaid)}</TableCell>
              <TableCell className="text-center">{client.monthsActive}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(client.ltv)}</TableCell>
              <TableCell>
                {format(new Date(client.first_payment_date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">MÉDIAS/TOTAL</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(clientsLTV.totalLTV / clientsLTV.clients.length)}
            </TableCell>
            <TableCell className="text-center font-bold">
              {Math.round(clientsLTV.clients.reduce((sum, client) => sum + client.monthsActive, 0) / clientsLTV.clients.length)}
            </TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(clientsLTV.averageLTV)}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};