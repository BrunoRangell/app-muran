
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { reviewAllClients } from "@/components/common/services/unifiedReviewService";

interface BatchOperationsConfig {
  platform: "meta" | "google";
  onComplete?: () => void;
  onProgress?: (progress: number, total: number, currentClient: string) => void;
}

export const useUnifiedBatchOperations = ({ platform, onComplete, onProgress }: BatchOperationsConfig) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentClientName, setCurrentClientName] = useState<string>("");
  const { toast } = useToast();

  const reviewAllClientsAction = useCallback(async (clients: any[]) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setTotal(clients.length);
      setProgress(0);
      
      console.log(`[useUnifiedBatchOperations] Iniciando revisão em lote para ${clients.length} clientes ${platform}`);
      
      const result = await reviewAllClients(clients, platform, () => {
        if (onComplete) onComplete();
      });
      
      toast({
        title: "Revisão em lote concluída",
        description: `${result.successCount} sucessos, ${result.errorCount} falhas`,
      });
      
    } catch (error) {
      console.error(`[useUnifiedBatchOperations] Erro na revisão em lote:`, error);
      toast({
        title: "Erro na revisão em lote",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setTotal(0);
      setCurrentClientName("");
    }
  }, [platform, isProcessing, onComplete, toast]);

  const cancelBatchProcessing = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setTotal(0);
    setCurrentClientName("");
    
    toast({
      title: "Processamento cancelado",
      description: "A revisão em lote foi cancelada pelo usuário",
    });
  }, [toast]);

  return {
    reviewAllClients: reviewAllClientsAction,
    cancelBatchProcessing,
    isProcessing,
    progress,
    total,
    currentClientName
  };
};
