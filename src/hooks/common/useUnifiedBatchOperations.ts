
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BatchOperation<T> {
  id: string | number;
  operation: (item: T) => Promise<void>;
  data: T;
}

interface UseUnifiedBatchOperationsProps<T> {
  onSuccess?: (results: T[]) => void;
  onError?: (error: Error) => void;
  batchSize?: number;
}

export function useUnifiedBatchOperations<T>({
  onSuccess,
  onError,
  batchSize = 5
}: UseUnifiedBatchOperationsProps<T> = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<T[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const { toast } = useToast();

  const executeBatch = async (operations: BatchOperation<T>[]) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: operations.length });
    setResults([]);
    setErrors([]);

    try {
      const batches = [];
      for (let i = 0; i < operations.length; i += batchSize) {
        batches.push(operations.slice(i, i + batchSize));
      }

      const allResults: T[] = [];
      const allErrors: Error[] = [];

      for (const batch of batches) {
        const batchPromises = batch.map(async ({ operation, data, id }) => {
          try {
            await operation(data);
            allResults.push(data);
            return { success: true, id, data };
          } catch (error) {
            const err = error instanceof Error ? error : new Error(`Erro no item ${id}`);
            allErrors.push(err);
            return { success: false, id, error: err };
          }
        });

        await Promise.all(batchPromises);
        setProgress(prev => ({ ...prev, current: prev.current + batch.length }));
      }

      setResults(allResults);
      setErrors(allErrors);

      if (allErrors.length === 0) {
        toast({
          title: "Sucesso",
          description: `${operations.length} operações concluídas com sucesso`,
        });
        onSuccess?.(allResults);
      } else {
        toast({
          title: "Parcialmente concluído",
          description: `${allResults.length} sucessos, ${allErrors.length} erros`,
          variant: "destructive",
        });
        onError?.(allErrors[0]);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Erro desconhecido");
      setErrors([err]);
      toast({
        title: "Erro",
        description: "Falha ao executar operações em lote",
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setProgress({ current: 0, total: 0 });
    setResults([]);
    setErrors([]);
  };

  return {
    isProcessing,
    progress,
    results,
    errors,
    executeBatch,
    reset,
    hasErrors: errors.length > 0,
    hasResults: results.length > 0,
    successRate: progress.total > 0 ? (results.length / progress.total) * 100 : 0
  };
}
