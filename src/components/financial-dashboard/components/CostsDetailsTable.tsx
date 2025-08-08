import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CostsDetailsTableProps {
  monthStr: string; // formato "Jan/25"
}

interface CostWithCategories {
  id: number;
  name: string;
  amount: number;
  date: string;
  costs_categories: { category_id: string }[];
}

export const CostsDetailsTable = ({ monthStr }: CostsDetailsTableProps) => {
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

  const { data: costs, isLoading, error } = useQuery({
    queryKey: ['costs-details', monthStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costs")
        .select(`
          id,
          name,
          amount,
          date,
          costs_categories (
            category_id
          )
        `)
        .gte("date", monthStart.toISOString().split('T')[0])
        .lte("date", monthEnd.toISOString().split('T')[0])
        .order("amount", { ascending: false });

      if (error) throw error;
      return data as CostWithCategories[];
    }
  });

  const getCategoryName = (categoryId: string) => {
    const categoryNames: { [key: string]: string } = {
      'marketing': 'Marketing',
      'vendas': 'Vendas',
      'plataformas_ferramentas': 'Plataformas/Ferramentas',
      'despesas_pessoal': 'Despesas Pessoal',
      'taxas_impostos': 'Taxas/Impostos',
      'servicos_profissionais': 'Serviços Profissionais',
      'eventos_networking': 'Eventos/Networking',
      'acoes_sociais': 'Ações Sociais'
    };
    return categoryNames[categoryId] || categoryId;
  };

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

  if (!costs || costs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">
          Nenhum custo registrado para este período
        </div>
      </div>
    );
  }

  const total = costs.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell className="font-medium">{cost.name}</TableCell>
              <TableCell>
                {cost.costs_categories?.length > 0 
                  ? cost.costs_categories.map(cat => getCategoryName(cat.category_id)).join(', ')
                  : 'Sem categoria'
                }
              </TableCell>
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
            <TableCell></TableCell>
            <TableCell className="font-bold text-right">{formatCurrency(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};