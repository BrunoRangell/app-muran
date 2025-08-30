
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
import { toast } from "sonner";
import { ImportTransactionsTable } from "./ImportTransactionsTable";
import { Transaction } from "./types";
import { useTransactionParser } from "./useTransactionParser";
import { useImportService } from "./useImportService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { EnhancedFileUpload } from "./components/EnhancedFileUpload";
import { UniversalMappingDialog } from "./components/UniversalMappingDialog";
import { UniversalMapping, FilePreview, OFXPreview } from "./types/mapping";
import { createPreviewFromFile, parseWithMapping } from "./utils/universalParser";
import { useTransactionValidation } from "./hooks/useTransactionValidation";
import { ImportSearchFilter } from "./ImportSearchFilter";
import { matchesSearchTerms } from "@/utils/searchUtils";

export function ImportCostsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | OFXPreview | null>(null);
  const [currentFileType, setCurrentFileType] = useState<'csv' | 'ofx'>('csv');
  
  const { parseOFXFile } = useTransactionParser();
  const { importTransactions } = useImportService();
  const queryClient = useQueryClient();
  const { errors, validateTransactions, clearError } = useTransactionValidation();

  const handleFileDetected = async (file: File, fileType: 'csv' | 'ofx') => {
    try {
      setIsLoading(true);
      const preview = await createPreviewFromFile(file);
      setFilePreview(preview);
      setCurrentFileType(fileType);
      setShowMapping(true);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingConfirm = async (mapping: UniversalMapping) => {
    try {
      setIsLoading(true);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      if (!file) {
        throw new Error("Arquivo não encontrado");
      }
      
      const text = await file.text();
      const parsedTransactions = parseWithMapping(text, mapping);
      
      setTransactions(parsedTransactions);
      setShowMapping(false);
      
      toast.success(`${parsedTransactions.length} transações encontradas`);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsLoading(false);
    }
  };

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
      toast.error("Selecione ao menos uma transação para importar.");
      return;
    }

    if (!validateTransactions(selectedTransactions)) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    try {
      const importedCount = await importTransactions(selectedTransactions);
      
      if (importedCount > 0) {
        await queryClient.invalidateQueries({ queryKey: ["costs"] });
        toast.success(`${importedCount} transações foram importadas com sucesso.`);
        setIsOpen(false);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Erro ao importar transações:", error);
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro ao importar as transações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTransactions([]);
    setSearchTerm("");
    setIsOpen(false);
  };


  // Filtrar transações baseado na pesquisa
  const filteredTransactions = transactions.filter(transaction =>
    matchesSearchTerms(transaction.name, searchTerm)
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar OFX/CSV
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Importar custos</DialogTitle>
            <DialogDescription>
              Selecione um arquivo OFX ou CSV para importar transações como custos. Categoria é opcional e pode ser adicionada depois.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            {transactions.length === 0 ? (
              <EnhancedFileUpload
                isLoading={isLoading}
                onTransactionsLoaded={setTransactions}
                parseOFXFile={parseOFXFile}
                onFileDetected={handleFileDetected}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <ImportSearchFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                  />
                  <div className="text-sm text-muted-foreground">
                    {filteredTransactions.length} de {transactions.length} transações
                  </div>
                </div>
                
                <ScrollArea className="h-[calc(80vh-280px)] w-full rounded-md border p-4">
                  <ImportTransactionsTable
                    transactions={filteredTransactions}
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

      {filePreview && (
        <UniversalMappingDialog
          open={showMapping}
          onOpenChange={setShowMapping}
          fileType={currentFileType}
          preview={filePreview}
          onConfirm={handleMappingConfirm}
        />
      )}
    </>
  );
}
