
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Cost } from "@/types/cost";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface CostsTableProps {
  costs: Cost[];
  isLoading: boolean;
  onEditClick: (cost: Cost) => void;
}

const categoryLabels: Record<string, string> = {
  marketing: "Marketing",
  salarios: "Salários",
  comissoes: "Comissões",
  impostos: "Impostos",
  alimentacao: "Alimentação",
  ferramentas_e_softwares: "Ferramentas e Softwares",
  viagem_e_hospedagem: "Viagem e Hospedagem",
  equipamentos_e_escritorio: "Equipamentos e Escritório",
  despesas_financeiras: "Despesas Financeiras",
  eventos_e_treinamentos: "Eventos e Treinamentos",
  doacoes: "Doações",
  outros: "Outros",
};

export function CostsTable({ costs, isLoading, onEditClick }: CostsTableProps) {
  if (isLoading) {
    return <div className="text-center py-4">Carregando custos...</div>;
  }

  if (costs.length === 0) {
    return <div className="text-center py-4">Nenhum custo encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell>{cost.name}</TableCell>
              <TableCell>{categoryLabels[cost.category]}</TableCell>
              <TableCell>{formatDate(cost.date)}</TableCell>
              <TableCell>{formatCurrency(cost.amount)}</TableCell>
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
      </Table>
    </div>
  );
}
