
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CostCategory } from "@/types/cost";
import { Transaction } from "./types";
import { CategorySearchSelect } from "./CategorySearchSelect";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ImportTransactionsTableProps {
  transactions: Transaction[];
  onNameChange: (fitid: string, newName: string) => void;
  onSelectionChange: (fitid: string, checked: boolean) => void;
  onCategoryChange: (fitid: string, category?: CostCategory) => void;
  errors: { [key: string]: string };
}

export function ImportTransactionsTable({
  transactions,
  onNameChange,
  onSelectionChange,
  onCategoryChange,
  errors,
}: ImportTransactionsTableProps) {
  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Selecionar</TableHead>
            <TableHead className="min-w-[400px]">Nome</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[140px]">Valor</TableHead>
            <TableHead className="w-[200px]">Categoria</TableHead>
          </TableRow>
        </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.fitid}>
            <TableCell>
              <Checkbox
                checked={transaction.selected}
                onCheckedChange={(checked) => 
                  onSelectionChange(transaction.fitid, checked as boolean)
                }
              />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      value={transaction.name}
                      onChange={(e) => onNameChange(transaction.fitid, e.target.value)}
                      className={`min-w-[400px] h-10 ${errors[`name-${transaction.fitid}`] ? "border-red-500" : ""}`}
                      placeholder="Nome da transação"
                    />
                  </TooltipTrigger>
                  {transaction.name.length > 60 && (
                    <TooltipContent>
                      <p className="max-w-md break-words">{transaction.name}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                {errors[`name-${transaction.fitid}`] && (
                  <p className="text-sm text-red-500">
                    {errors[`name-${transaction.fitid}`]}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
            <TableCell>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(transaction.amount)}
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <CategorySearchSelect
                  value={transaction.category}
                  onValueChange={(value) => onCategoryChange(transaction.fitid, value)}
                  hasError={!!errors[`category-${transaction.fitid}`]}
                />
                {errors[`category-${transaction.fitid}`] && (
                  <p className="text-sm text-red-500">
                    {errors[`category-${transaction.fitid}`]}
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TooltipProvider>
  );
}
