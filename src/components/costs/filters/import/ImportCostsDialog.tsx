
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
import { CostCategory } from "@/types/cost";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";

export function ImportCostsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const { parseOFXFile } = useTransactionParser();
  const { importTransactions } = useImportService();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo OFX para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Iniciando processamento do arquivo:", file.name);
      const parsedTransactions = await parseOFXFile(file);
      console.log("Transações parseadas:", parsedTransactions);
      
      if (!parsedTransactions || parsedTransactions.length === 0) {
        toast({
          title: "Nenhuma transação encontrada",
          description: "O arquivo não contém transações válidas para importação.",
          variant: "destructive"
        });
        return;
      }

      setTransactions(parsedTransactions);
      toast({
        title: "Arquivo processado com sucesso",
        description: `${parsedTransactions.length} transações encontradas.`
      });
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

  const validateTransactions = (selectedTransactions: Transaction[]) => {
    const newErrors: { [key: string]: string } = {};
    let hasErrors = false;

    selectedTransactions.forEach(transaction => {
      if (!transaction.name?.trim()) {
        newErrors[`name-${transaction.fitid}`] = "Nome é obrigatório";
        hasErrors = true;
      }
      if (!transaction.category) {
        newErrors[`category-${transaction.fitid}`] = "Categoria é obrigatória";
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleNameChange = (fitid: string, newName: string) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, name: newName } : t)
    );
    // Limpa o erro quando o campo é preenchido
    if (newName.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`name-${fitid}`];
        return newErrors;
      });
    }
  };

  const handleSelectionChange = (fitid: string, checked: boolean) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, selected: checked } : t)
    );
  };

  const handleCategoryChange = (fitid: string, category?: CostCategory) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, category } : t)
    );
    // Limpa o erro quando uma categoria é selecionada
    if (category) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`category-${fitid}`];
        return newErrors;
      });
    }
  };

  const handleImport = async () => {
    const selectedTransactions = transactions.filter(t => t.selected);
    
    if (selectedTransactions.length === 0) {
      toast({
        title: "Nenhuma transação selecionada",
        description: "Selecione ao menos uma transação para importar.",
        variant: "destructive"
      });
      return;
    }

    // Valida as transações antes de importar
    if (!validateTransactions(selectedTransactions)) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Iniciando importação de", selectedTransactions.length, "transações");
      const importedCount = await importTransactions(selectedTransactions);
      console.log("Importação finalizada. Total importado:", importedCount);
      
      if (importedCount > 0) {
        // Invalidar a cache do React Query para atualizar a lista de custos
        await queryClient.invalidateQueries({ queryKey: ["costs"] });
        
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
        description: error instanceof Error ? error.message : "Ocorreu um erro ao importar as transações. Tente novamente.",
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
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Importar custos do OFX</DialogTitle>
          <DialogDescription>
            Selecione um arquivo OFX do seu banco para importar as transações como custos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
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
                {isLoading ? "Processando arquivo..." : "Selecione um arquivo OFX para começar"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="h-[calc(80vh-220px)] w-full rounded-md border p-4">
                <ImportTransactionsTable
                  transactions={transactions}
                  onNameChange={handleNameChange}
                  onSelectionChange={handleSelectionChange}
                  onCategoryChange={handleCategoryChange}
                  errors={errors}
                />
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTransactions([]);
                    setErrors({});
                    setIsOpen(false);
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isLoading || !transactions.some(t => t.selected)}
                >
                  {isLoading ? "Importando..." : "Importar Selecionados"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
