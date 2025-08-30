import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Transaction } from "../types";

interface EnhancedFileUploadProps {
  isLoading: boolean;
  onTransactionsLoaded: (transactions: Transaction[]) => void;
  parseOFXFile: (file: File) => Promise<Transaction[]>;
  onFileDetected: (file: File, fileType: 'csv' | 'ofx') => void;
}

export function EnhancedFileUpload({ 
  isLoading, 
  onTransactionsLoaded, 
  parseOFXFile,
  onFileDetected
}: EnhancedFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.ofx') && !file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Apenas arquivos OFX e CSV são suportados");
      return;
    }
    
    setSelectedFile(file);
    handleFileProcess(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleFileProcess(file);
    }
  };

  const handleFileProcess = async (file: File) => {
    setUploadProgress(0);

    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      if (fileExtension === 'ofx') {
        setUploadProgress(50);
        const transactions = await parseOFXFile(file);
        setUploadProgress(100);
        onTransactionsLoaded(transactions);
        toast.success(`${transactions.length} transações carregadas do arquivo OFX`);
      } else if (fileExtension === 'csv') {
        setUploadProgress(50);
        onFileDetected(file, 'csv');
        setUploadProgress(100);
      } else {
        throw new Error('Formato de arquivo não suportado. Use arquivos .ofx ou .csv');
      }
    } catch (error) {
      console.error('Erro no processamento do arquivo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      clearFile();
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </h3>
        <p className="text-muted-foreground mb-4">
          Suporte para arquivos OFX e CSV
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">.ofx</Badge>
          <Badge variant="secondary">.csv</Badge>
        </div>
      </div>

      {/* Hidden Input */}
      <input
        id="file-upload"
        type="file"
        accept=".ofx,.csv"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      {/* Selected File */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFile}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processando arquivo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
    </div>
  );
}