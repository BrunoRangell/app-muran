import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { parseMonthString } from "@/utils/monthParser";

interface ProfitDetailsTableProps {
  monthStr: string; // formato "Jan/25"
}

export const ProfitDetailsTable = ({ monthStr }: ProfitDetailsTableProps) => {
  // Parse monthStr to get start and end dates
  const { monthStart, monthEnd, fullYear, month } = parseMonthString(monthStr);

  const { data, isLoading, error } = useQuery({
    queryKey: ['profit-details', monthStr],
    queryFn: async () => {
      // Buscar receitas do mês
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("amount")
        .gte("reference_month", monthStart.toISOString().split('T')[0])
        .lt("reference_month", new Date(fullYear, month + 1, 1).toISOString().split('T')[0])
        .gt("amount", 0);

      if (paymentsError) throw paymentsError;

      // Buscar custos do mês
      const { data: costs, error: costsError } = await supabase
        .from("costs")
        .select(`
          name,
          amount,
          costs_categories (
            category_id
          )
        `)
        .gte("date", monthStart.toISOString().split('T')[0])
        .lte("date", monthEnd.toISOString().split('T')[0]);

      if (costsError) throw costsError;

      const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const totalCosts = costs?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
      const profit = totalRevenue - totalCosts;

      return {
        totalRevenue,
        totalCosts,
        profit,
        profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
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
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium text-green-600">Receita Total</TableCell>
            <TableCell className="text-right text-green-600">{formatCurrency(data.totalRevenue)}</TableCell>
            <TableCell className="text-right">100%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-red-600">Custos Totais</TableCell>
            <TableCell className="text-right text-red-600">-{formatCurrency(data.totalCosts)}</TableCell>
            <TableCell className="text-right">
              {data.totalRevenue > 0 ? `${((data.totalCosts / data.totalRevenue) * 100).toFixed(1)}%` : '-'}
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">
              <span className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                Lucro Líquido
              </span>
            </TableCell>
            <TableCell className={`text-right font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.profit)}
            </TableCell>
            <TableCell className="text-right font-bold">
              {data.profitMargin.toFixed(1)}%
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};