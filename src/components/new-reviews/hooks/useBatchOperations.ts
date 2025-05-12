
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getMetaToken } from "@/lib/metaAuth";

export function useBatchOperations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const processBatch = async (
    clientIds: string[], 
    processFn: (clientId: string, accessToken: string) => Promise<any>
  ) => {
    if (clientIds.length === 0) {
      toast.error("Nenhum cliente selecionado para processamento");
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalCount(clientIds.length);
    
    try {
      const accessToken = await getMetaToken();
      if (!accessToken) {
        toast.error("Token de acesso não encontrado. Faça login novamente.");
        return;
      }

      for (let i = 0; i < clientIds.length; i++) {
        const clientId = clientIds[i];
        try {
          await processFn(clientId, accessToken);
          setProcessedCount((prev) => prev + 1);
        } catch (error) {
          console.error(`Erro ao processar cliente ${clientId}:`, error);
          toast.error(`Falha ao processar cliente: ${
            axios.isAxiosError(error) 
              ? error.response?.data?.message || error.message 
              : 'Erro desconhecido'
          }`);
        }
      }
      
      toast.success(`${processedCount} de ${totalCount} clientes processados com sucesso!`);
    } catch (error) {
      console.error("Erro ao processar lote de clientes:", error);
      toast.error("Erro ao processar lote de clientes");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    isProcessing,
    processedCount,
    totalCount,
    processBatch
  };
}
