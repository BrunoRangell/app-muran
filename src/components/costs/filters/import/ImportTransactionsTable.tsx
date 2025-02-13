
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CostCategory } from "@/types/cost";
import { Transaction } from "./types";
import { COST_CATEGORIES } from "../../schemas/costFormSchema";

interface ImportTransactionsTableProps {
  transactions: Transaction[];
  onNameChange: (fitid: string, newName: string) => void;
  onSelectionChange: (fitid: string, checked: boolean) => void;
  onCategoryChange: (fitid: string, categories: CostCategory[]) => void;
}

export function ImportTransactionsTable({
  transactions,
  onNameChange,
  onSelectionChange,
  onCategoryChange,
}: ImportTransactionsTableProps) {
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {transaction.categories.length === 0 ? (
                      <span className="text-muted-foreground">Selecione as categorias...</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {transaction.categories.map((categoryId) => {
                          const category = COST_CATEGORIES.find((c) => c.id === categoryId);
                          return category ? (
                            <Badge
                              key={category.id}
                              variant="secondary"
                              className="truncate max-w-[100px]"
                            >
                              {category.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[380px] max-h-[300px] overflow-y-auto">
                  <div className="p-2 space-y-2">
                    {COST_CATEGORIES.map((category) => {
                      const isSelected = transaction.categories.includes(category.id as CostCategory);
                      
                      return (
                        <div
                          key={category.id}
                          className={cn(
                            "flex flex-col space-y-1 rounded-md p-2 cursor-pointer hover:bg-muted",
                            isSelected && "bg-muted"
                          )}
                          onClick={() => {
                            const newCategories = isSelected
                              ? transaction.categories.filter(id => id !== category.id)
                              : [...transaction.categories, category.id as CostCategory];
                            
                            onCategoryChange(transaction.fitid, newCategories);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4">
                              {isSelected && <Check className="h-4 w-4" />}
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {category.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
