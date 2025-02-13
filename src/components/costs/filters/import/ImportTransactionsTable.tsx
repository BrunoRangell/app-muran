
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
import { Badge } from "@/components/ui/badge";

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

  const getCategoryColor = (categoryId?: CostCategory) => {
    if (!categoryId) return "bg-gray-100";
    const category = COST_CATEGORIES.find(c => c.id === categoryId);
    return category ? "bg-primary/10 text-primary border-primary" : "bg-gray-100";
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[120px]">Valor</TableHead>
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
                  <SelectTrigger className="w-full">
                    {transaction.category ? (
                      <Badge variant="outline" className={getCategoryColor(transaction.category)}>
                        {getCategoryName(transaction.category)}
                      </Badge>
                    ) : (
                      <SelectValue placeholder="Categoria" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COST_CATEGORIES.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id}
                          className="py-2"
                        >
                          <div className="space-y-1">
                            <Badge variant="outline" className={getCategoryColor(category.id as CostCategory)}>
                              {category.name}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
