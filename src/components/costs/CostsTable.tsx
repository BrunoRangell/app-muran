
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { Cost, COST_CATEGORIES_HIERARCHY } from "@/types/cost";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface CostsTableProps {
  costs: Cost[];
  isLoading: boolean;
  onEditClick: (cost: Cost) => void;
}

export function CostsTable({ costs, isLoading, onEditClick }: CostsTableProps) {
  if (isLoading) {
    return <div className="text-center py-4">Carregando custos...</div>;
  }

  if (costs.length === 0) {
    return <div className="text-center py-4">Nenhum custo encontrado.</div>;
  }

  const getCategoryLabel = (cost: Cost) => {
    const mainCategory = COST_CATEGORIES_HIERARCHY[cost.main_category];
    const subcategory = mainCategory.categories.find(cat => cat.value === cost.subcategory);
    return `${mainCategory.label} - ${subcategory?.label || cost.subcategory}`;
  };

  const totalAmount = costs.reduce((acc, cost) => acc + Number(cost.amount), 0);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell>{cost.name}</TableCell>
              <TableCell>{getCategoryLabel(cost)}</TableCell>
              <TableCell>{formatDate(cost.date)}</TableCell>
              <TableCell>{formatCurrency(cost.amount)}</TableCell>
              <TableCell>
                {cost.tags?.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="mr-1">
                    {tag.name}
                  </Badge>
                ))}
              </TableCell>
              <TableCell>{cost.description || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditClick(cost)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">
              Total
            </TableCell>
            <TableCell className="font-medium">
              {formatCurrency(totalAmount)}
            </TableCell>
            <TableCell colSpan={3} />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
