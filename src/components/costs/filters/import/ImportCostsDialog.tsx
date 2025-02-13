
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ImportTransactionsTable } from "./ImportTransactionsTable";
import { Transaction } from "./types";
import { useTransactionParser } from "./useTransactionParser";
import { useImportService } from "./useImportService";
import { CostMainCategory, CostSubcategory } from "@/types/cost";

export function ImportCostsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { parseOFXFile } = useTransactionParser();
  const { importTransactions } = useImportService();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const parsedTransactions = await parseOFXFile(file);
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

      const importedCount = await importTransactions(selectedTransactions);
      
      if (importedCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${importedCount} transações foram importadas com sucesso.`
        });
        setIsOpen(false);
        setTransactions([]);
      }
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
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar custos do OFX</DialogTitle>
          <DialogDescription>
            Selecione um arquivo OFX do seu banco para importar as transações como custos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 py-4">
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
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto">
                <ImportTransactionsTable
                  transactions={transactions}
                  onNameChange={handleNameChange}
                  onSelectionChange={handleSelectionChange}
                  onCategoryChange={handleCategoryChange}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
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
