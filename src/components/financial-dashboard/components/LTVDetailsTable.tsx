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
  contract_value: number;
  monthsActiveUntilMonth: number;
  ltv: number;
}

export const LTVDetailsTable = ({ monthStr }: LTVDetailsTableProps) => {
  // Parse monthStr (example: "Jan/25" or "6/25")
  const { monthStart, monthEnd, month, fullYear } = parseMonthString(monthStr);
  const referenceDate = monthEnd; // Last day of the month

  const { data: clientsLTV, isLoading, error } = useQuery({
    queryKey: ['ltv-details', monthStr],
    queryFn: async () => {
      // Buscar todos os clientes
      const { data: allClients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          first_payment_date,
          last_payment_date,
          status,
          contract_value
        `);

      if (clientsError) throw clientsError;

      // Filtrar clientes que estavam ativos no mês específico
      const activeClientsInMonth = (allClients || []).filter(client => {
        const firstPaymentDate = new Date(client.first_payment_date);
        const lastPaymentDate = client.last_payment_date ? new Date(client.last_payment_date) : null;
        
        // Cliente estava ativo se começou antes/durante o mês de referência
        // e não cancelou antes do mês de referência
        const wasActive = firstPaymentDate <= referenceDate &&
          (!lastPaymentDate || lastPaymentDate >= monthStart);
        
        return wasActive && client.status === 'active';
      });

      // Calcular LTV para cada cliente ativo no mês
      const clientsWithLTV: ClientLTV[] = activeClientsInMonth.map(client => {
        const firstPaymentDate = new Date(client.first_payment_date);
        
        // Calcular meses ativos até a data de referência
        const monthsActiveUntilMonth = Math.max(1, 
          (fullYear - firstPaymentDate.getFullYear()) * 12 +
          (month - firstPaymentDate.getMonth()) + 1
        );
        
        // Calculate LTV: contract_value * monthsActive até aquele mês
        const ltv = client.contract_value * monthsActiveUntilMonth;

        return {
          id: client.id,
          company_name: client.company_name,
          first_payment_date: client.first_payment_date,
          contract_value: client.contract_value,
          monthsActiveUntilMonth,
          ltv
        };
      });

      // Ordenar por LTV decrescente
      clientsWithLTV.sort((a, b) => b.ltv - a.ltv);

      const averageLTV = clientsWithLTV.length > 0 
        ? clientsWithLTV.reduce((sum, client) => sum + client.ltv, 0) / clientsWithLTV.length 
        : 0;

      return {
        clients: clientsWithLTV,
        averageLTV,
        totalActiveClients: clientsWithLTV.length
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
                Baseado em {clientsLTV.totalActiveClients} clientes ativos neste mês
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/50 p-3 rounded-lg">
                <span className="text-sm text-muted-foreground block">LTV Médio:</span>
                <div className="text-2xl font-bold text-primary">{formatCurrency(clientsLTV.averageLTV)}</div>
              </div>
              <div className="bg-background/50 p-3 rounded-lg">
                <span className="text-sm text-muted-foreground block">Fórmula:</span>
                <div className="text-sm font-medium">Valor Contrato × Meses Ativos até {monthStr}</div>
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
              <TableHead className="text-right">Valor Contrato</TableHead>
              <TableHead className="text-center">Meses Ativos</TableHead>
              <TableHead className="text-right">LTV Individual</TableHead>
              <TableHead>Data de Início</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsLTV.clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.company_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(client.contract_value)}</TableCell>
                <TableCell className="text-center">{client.monthsActiveUntilMonth}</TableCell>
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