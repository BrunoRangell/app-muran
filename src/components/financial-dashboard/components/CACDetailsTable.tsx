import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CACDetailsTableProps {
  monthStr: string; // formato "Jan/25"
}

export const CACDetailsTable = ({ monthStr }: CACDetailsTableProps) => {
  // Converter monthStr (ex: "Jan/25") para período de busca
  const monthMapping: { [key: string]: number } = {
    'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
    'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
  };
  
  const [monthAbbr, yearStr] = monthStr.toLowerCase().split('/');
  const month = monthMapping[monthAbbr];
  const fullYear = parseInt(yearStr) < 50 ? 2000 + parseInt(yearStr) : 1900 + parseInt(yearStr);
  const monthStart = new Date(fullYear, month - 1, 1);
  const monthEnd = new Date(fullYear, month, 0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cac-details', monthStr],
    queryFn: async () => {
      // Buscar custos de aquisição (marketing + vendas) nos últimos 3 meses
      const threeMonthsAgo = new Date(fullYear, month - 4, 1);
      
      const { data: costs, error: costsError } = await supabase
        .from("costs")
        .select(`
          name,
          amount,
          date,
          costs_categories (
            category_id
          )
        `)
        .gte("date", threeMonthsAgo.toISOString().split('T')[0])
        .lte("date", monthEnd.toISOString().split('T')[0]);

      if (costsError) throw costsError;

      // Filtrar custos de aquisição
      const acquisitionCosts = costs?.filter(cost => 
        cost.costs_categories?.some(cat => 
          cat.category_id === 'marketing' || cat.category_id === 'vendas'
        )
      ) || [];

      // Buscar novos clientes no mês
      const { data: newClients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          first_payment_date,
          contract_value,
          acquisition_channel
        `)
        .gte("first_payment_date", monthStart.toISOString().split('T')[0])
        .lte("first_payment_date", monthEnd.toISOString().split('T')[0]);

      if (clientsError) throw clientsError;

      const totalAcquisitionCosts = acquisitionCosts.reduce((sum, cost) => sum + cost.amount, 0);
      const newClientsCount = newClients?.length || 0;
      const cac = newClientsCount > 0 ? totalAcquisitionCosts / newClientsCount : 0;

      return {
        acquisitionCosts,
        newClients: newClients || [],
        totalAcquisitionCosts,
        newClientsCount,
        cac
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

  if (!data) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">
          Nenhum dado encontrado para este período
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do CAC */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-2">Resumo do CAC</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Custos de Aquisição (3 meses):</span>
            <div className="font-medium">{formatCurrency(data.totalAcquisitionCosts)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Novos Clientes:</span>
            <div className="font-medium">{data.newClientsCount}</div>
          </div>
          <div>
            <span className="text-muted-foreground">CAC:</span>
            <div className="font-medium text-primary">{formatCurrency(data.cac)}</div>
          </div>
        </div>
      </div>

      {/* Novos Clientes */}
      {data.newClients.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Novos Clientes - {monthStr}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Canal de Aquisição</TableHead>
                <TableHead>Valor do Contrato</TableHead>
                <TableHead>Data de Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.newClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.company_name}</TableCell>
                  <TableCell>{client.acquisition_channel || 'Não informado'}</TableCell>
                  <TableCell>{formatCurrency(client.contract_value)}</TableCell>
                  <TableCell>
                    {format(new Date(client.first_payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Custos de Aquisição */}
      {data.acquisitionCosts.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Custos de Aquisição (Últimos 3 meses)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.acquisitionCosts.map((cost, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{cost.name}</TableCell>
                  <TableCell>
                    {format(new Date(cost.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold text-right">{formatCurrency(data.totalAcquisitionCosts)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
};