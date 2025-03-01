
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ClientBudget, type BudgetValues } from "../hooks/useBudgetSetup";

type BudgetTableProps = {
  filteredClients: ClientBudget[] | undefined;
  isLoading: boolean;
  budgets: Record<string, BudgetValues>;
  searchTerm: string;
  onBudgetChange: (clientId: string, value: string) => void;
  onAccountIdChange: (clientId: string, value: string) => void;
};

export const BudgetTable = ({
  filteredClients,
  isLoading,
  budgets,
  searchTerm,
  onBudgetChange,
  onAccountIdChange,
}: BudgetTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin mr-2" />
        <span>Carregando clientes...</span>
      </div>
    );
  }

  if (filteredClients?.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        Nenhum cliente encontrado com o termo "{searchTerm}"
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Cliente</TableHead>
            <TableHead className="w-[200px]">ID da Conta Meta</TableHead>
            <TableHead>Orçamento Meta Ads Mensal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients?.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.company_name}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`account-${client.id}`} className="sr-only">
                    ID da Conta Meta
                  </Label>
                  <Input
                    id={`account-${client.id}`}
                    placeholder="ID da conta"
                    value={budgets[client.id]?.accountId || ""}
                    onChange={(e) => onAccountIdChange(client.id, e.target.value)}
                    className="max-w-[150px]"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`meta-${client.id}`} className="sr-only">
                    Orçamento Meta Ads
                  </Label>
                  <span className="text-gray-500">R$</span>
                  <Input
                    id={`meta-${client.id}`}
                    placeholder="0,00"
                    value={budgets[client.id]?.meta || ""}
                    onChange={(e) => onBudgetChange(client.id, e.target.value)}
                    className="max-w-[150px]"
                    type="text"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
