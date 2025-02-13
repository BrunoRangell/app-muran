
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CostCategory } from "@/types/cost";
import { Transaction } from "./types";
import { COST_CATEGORIES } from "../../schemas/costFormSchema";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportTransactionsTableProps {
  transactions: Transaction[];
  onNameChange: (fitid: string, newName: string) => void;
  onSelectionChange: (fitid: string, checked: boolean) => void;
  onCategoryChange: (fitid: string, category?: CostCategory) => void;
}

export function ImportTransactionsTable({
  transactions,
  onNameChange,
  onSelectionChange,
  onCategoryChange,
}: ImportTransactionsTableProps) {
  const getCategoryName = (categoryId?: CostCategory) => {
    if (!categoryId) return "";
    const category = COST_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || "";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox />
          </TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Categoria</TableHead>
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
              <Input
                value={transaction.name}
                onChange={(e) => onNameChange(transaction.fitid, e.target.value)}
              />
            </TableCell>
            <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
            <TableCell>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(transaction.amount)}
            </TableCell>
            <TableCell>
              <Select
                value={transaction.category}
                onValueChange={(value) => onCategoryChange(transaction.fitid, value as CostCategory)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecionar categoria">
                    {getCategoryName(transaction.category)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent 
                  className="bg-popover w-[280px] rounded-md"
                  position="popper"
                  sideOffset={5}
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    <SelectGroup className="p-2">
                      {COST_CATEGORIES.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id}
                          className="flex flex-col space-y-1 py-2 px-2 cursor-pointer rounded-md data-[highlighted]:bg-accent"
                        >
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {category.description}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </div>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
