
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
import { useToast } from "@/hooks/use-toast";
import { ImportTransactionsTable } from "./ImportTransactionsTable";
import { Transaction } from "./types";
import { useTransactionParser } from "./useTransactionParser";
import { useImportService } from "./useImportService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { FileUploadForm } from "./components/FileUploadForm";
import { useTransactionValidation } from "./hooks/useTransactionValidation";

export function ImportCostsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { parseOFXFile } = useTransactionParser();
  const { importTransactions } = useImportService();
  const queryClient = useQueryClient();
  const { errors, validateTransactions, clearError } = useTransactionValidation();

  const handleNameChange = (fitid: string, newName: string) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, name: newName } : t)
    );
    clearError('name', fitid);
  };

  const handleSelectionChange = (fitid: string, checked: boolean) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, selected: checked } : t)
    );
  };

  const handleCategoryChange = (fitid: string, category?: any) => {
    setTransactions(prev => 
      prev.map(t => t.fitid === fitid ? { ...t, category } : t)
    );
    clearError('category', fitid);
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
      const importedCount = await importTransactions(selectedTransactions);
      
      if (importedCount > 0) {
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

  const handleCancel = () => {
    setTransactions([]);
    setIsOpen(false);
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
            <FileUploadForm
              isLoading={isLoading}
              onTransactionsLoaded={setTransactions}
              parseOFXFile={parseOFXFile}
            />
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

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={isLoading || !transactions.some(t => t.selected)}
                  className="bg-muran-primary hover:bg-muran-primary/90"
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
