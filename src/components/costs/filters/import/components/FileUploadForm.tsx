
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "../types";

interface FileUploadFormProps {
  isLoading: boolean;
  onTransactionsLoaded: (transactions: Transaction[]) => void;
  parseOFXFile: (file: File) => Promise<Transaction[]>;
}

export function FileUploadForm({ isLoading, onTransactionsLoaded, parseOFXFile }: FileUploadFormProps) {
  const { toast } = useToast();

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

      onTransactionsLoaded(parsedTransactions);
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
    }
  };

  return (
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
  );
}
