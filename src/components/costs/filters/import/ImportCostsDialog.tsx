
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CostMainCategory, CostSubcategory, COST_CATEGORIES_HIERARCHY } from "@/types/cost";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Banking } from 'ofx-js';

interface Transaction {
  fitid: string;
  name: string;
  amount: number;
  date: string;
  selected: boolean;
  mainCategory?: CostMainCategory;
  subcategory?: CostSubcategory;
}

export function ImportCostsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const ofx = await Banking.parse(text);
      
      if (!ofx.bankAccounts?.[0]?.transactions) {
        throw new Error("Nenhuma transação encontrada no arquivo");
      }

      // Buscar mapeamentos existentes
      const { data: existingMappings } = await supabase
        .from('transaction_categories_mapping')
        .select('*')
        .order('usage_count', { ascending: false });

      const parsedTransactions: Transaction[] = ofx.bankAccounts[0].transactions.map(t => {
        // Tentar encontrar um mapeamento existente
        const mapping = existingMappings?.find(m => 
          t.name.toLowerCase().includes(m.description_pattern.toLowerCase())
        );

        return {
          fitid: t.fitId,
          name: t.name,
          amount: Math.abs(Number(t.amount)), // Convertemos para positivo pois tratamos tudo como despesa
          date: new Date(t.date).toISOString().split('T')[0],
          selected: true,
          mainCategory: mapping?.main_category,
          subcategory: mapping?.subcategory
        };
      });
      
      setTransactions(parsedTransactions);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível ler o arquivo OFX. Certifique-se que é um arquivo válido.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (fitid: string, newName: string) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, name: newName } : t)
    );
  };

  const handleSelectionChange = (fitid: string, checked: boolean) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, selected: checked } : t)
    );
  };

  const handleCategoryChange = (fitid: string, mainCategory: CostMainCategory, subcategory: CostSubcategory) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, mainCategory, subcategory } : t)
    );
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const selectedTransactions = transactions.filter(t => t.selected && t.mainCategory && t.subcategory);
      
      if (selectedTransactions.length === 0) {
        toast({
          title: "Nenhuma transação selecionada",
          description: "Selecione ao menos uma transação e categorize-a para importar.",
          variant: "destructive"
        });
        return;
      }

      // Verificar transações já importadas
      const fitIds = selectedTransactions.map(t => t.fitid);
      const { data: existingImports } = await supabase
        .from('imported_transactions')
        .select('fitid')
        .in('fitid', fitIds);

      const alreadyImported = new Set(existingImports?.map(i => i.fitid) || []);
      const newTransactions = selectedTransactions.filter(t => !alreadyImported.has(t.fitid));

      if (newTransactions.length === 0) {
        toast({
          title: "Transações já importadas",
          description: "Todas as transações selecionadas já foram importadas anteriormente.",
          variant: "destructive"
        });
        return;
      }

      // Importar transações como custos
      for (const transaction of newTransactions) {
        const { data: cost, error: costError } = await supabase
          .from('costs')
          .insert({
            name: transaction.name,
            amount: transaction.amount,
            date: transaction.date,
            main_category: transaction.mainCategory,
            subcategory: transaction.subcategory
          })
          .select()
          .single();

        if (costError) throw costError;

        // Registrar transação importada
        const { error: importError } = await supabase
          .from('imported_transactions')
          .insert({
            fitid: transaction.fitid,
            cost_id: cost.id
          });

        if (importError) throw importError;

        // Registrar ou atualizar mapeamento de categoria
        const { error: mappingError } = await supabase
          .from('transaction_categories_mapping')
          .upsert({
            description_pattern: transaction.name,
            main_category: transaction.mainCategory,
            subcategory: transaction.subcategory,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          }, {
            onConflict: 'description_pattern',
            ignoreDuplicates: false
          });

        if (mappingError) throw mappingError;
      }

      toast({
        title: "Importação concluída",
        description: `${newTransactions.length} transações foram importadas com sucesso.`
      });

      setIsOpen(false);
      setTransactions([]);
    } catch (error) {
      console.error("Erro ao importar transações:", error);
      toast({
        title: "Erro ao importar",
        description: "Ocorreu um erro ao importar as transações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar OFX
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importar custos do OFX</DialogTitle>
          <DialogDescription>
            Selecione um arquivo OFX do seu banco para importar as transações como custos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Input
                type="file"
                accept=".ofx"
                onChange={handleFileUpload}
                className="max-w-xs"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Selecione um arquivo OFX para começar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Categoria Principal</TableHead>
                    <TableHead>Subcategoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.fitid}>
                      <TableCell>
                        <Checkbox
                          checked={transaction.selected}
                          onCheckedChange={(checked) => 
                            handleSelectionChange(transaction.fitid, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={transaction.name}
                          onChange={(e) => handleNameChange(transaction.fitid, e.target.value)}
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
                          value={transaction.mainCategory}
                          onValueChange={(value: CostMainCategory) => {
                            const subcategories = COST_CATEGORIES_HIERARCHY[value].categories;
                            handleCategoryChange(
                              transaction.fitid,
                              value,
                              subcategories[0].value
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(COST_CATEGORIES_HIERARCHY).map(([value, { label }]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.subcategory}
                          onValueChange={(value: CostSubcategory) => {
                            handleCategoryChange(
                              transaction.fitid,
                              transaction.mainCategory!,
                              value
                            );
                          }}
                          disabled={!transaction.mainCategory}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {transaction.mainCategory &&
                              COST_CATEGORIES_HIERARCHY[transaction.mainCategory].categories.map(
                                (category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                )
                              )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTransactions([]);
                    setIsOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isLoading || !transactions.some(t => t.selected)}
                >
                  Importar Selecionados
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
