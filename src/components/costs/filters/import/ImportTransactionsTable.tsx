
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

interface ImportTransactionsTableProps {
  transactions: Transaction[];
  onNameChange: (fitid: string, newName: string) => void;
  onSelectionChange: (fitid: string, checked: boolean) => void;
  onCategoryChange: (fitid: string, categories: CostCategory[]) => void;
}

const CATEGORIES = [
  {
    id: 'marketing' as CostCategory,
    name: 'Marketing',
    description: 'Gastos com publicidade, propaganda e marketing digital'
  },
  {
    id: 'vendas' as CostCategory,
    name: 'Vendas',
    description: 'Custos relacionados à equipe e atividades de vendas'
  },
  {
    id: 'plataformas_ferramentas' as CostCategory,
    name: 'Plataformas e Ferramentas',
    description: 'Assinaturas de software, hosting e ferramentas'
  },
  {
    id: 'despesas_pessoal' as CostCategory,
    name: 'Despesas com Pessoal',
    description: 'Salários, benefícios e despesas relacionadas à equipe'
  },
  {
    id: 'taxas_impostos' as CostCategory,
    name: 'Taxas e Impostos',
    description: 'Pagamentos de impostos, taxas e contribuições'
  },
  {
    id: 'servicos_profissionais' as CostCategory,
    name: 'Serviços Profissionais',
    description: 'Consultoria, contabilidade e outros serviços terceirizados'
  },
  {
    id: 'eventos_networking' as CostCategory,
    name: 'Eventos e Networking',
    description: 'Participação em eventos, conferências e networking'
  },
  {
    id: 'acoes_sociais' as CostCategory,
    name: 'Ações Sociais',
    description: 'Investimentos em responsabilidade social e sustentabilidade'
  }
];

export function ImportTransactionsTable({
  transactions,
  onNameChange,
  onSelectionChange,
  onCategoryChange,
}: ImportTransactionsTableProps) {
  const toggleCategory = (fitid: string, categoryId: CostCategory, currentCategories: CostCategory[]) => {
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    onCategoryChange(fitid, newCategories);
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
                          const category = CATEGORIES.find((c) => c.id === categoryId);
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
                <PopoverContent className="w-[380px] p-0">
                  <Command>
                    <CommandInput placeholder="Procurar categoria..." />
                    <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                    <CommandGroup>
                      {CATEGORIES.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.id}
                          onSelect={() => toggleCategory(transaction.fitid, category.id, transaction.categories)}
                        >
                          <div className="flex flex-col flex-1 py-2">
                            <div className="flex items-center">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  transaction.categories.includes(category.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">
                              {category.description}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
