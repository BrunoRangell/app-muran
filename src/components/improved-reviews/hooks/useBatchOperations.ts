
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type BatchOperationsConfig = {
  onComplete?: () => void;
  platform: "meta" | "google";
};

export function useBatchOperations(config: BatchOperationsConfig) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Iniciar processamento de um cliente específico
  const startClientProcessing = (clientId: string) => {
    setProcessingIds(prev => [...prev, clientId]);
  };

  // Finalizar processamento de um cliente específico  
  const finishClientProcessing = (clientId: string) => {
    setProcessingIds(prev => prev.filter(id => id !== clientId));
    setProgress(prev => prev + 1);
  };

  // Revisar um cliente específico
  const reviewClient = async (clientId: string, accountId?: string) => {
    startClientProcessing(clientId);
    
    try {
      const reviewDate = new Date().toISOString().split("T")[0];
      
      // Obter detalhes do cliente
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (!client) {
        throw new Error("Cliente não encontrado");
      }
      
      // Definir endpoint baseado na plataforma
      const url = `${window.location.origin}/api/${config.platform === "meta" ? "daily-meta-review" : "daily-google-review"}`;
      
      // Construir payload
      const payload = {
        clientId,
        reviewDate,
        [`${config.platform}AccountId`]: accountId || client[`${config.platform}_account_id`]
      };
      
      // Fazer chamada para a função Edge
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Erro ao processar revisão");
      }
      
      toast({
        title: "Revisão concluída",
        description: `Cliente ${client.company_name} revisado com sucesso.`,
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "Erro na revisão",
        description: error.message || "Ocorreu um erro ao revisar o cliente",
        variant: "destructive",
      });
      throw error;
    } finally {
      finishClientProcessing(clientId);
    }
  };
  
  // Revisar todos os clientes
  const reviewAllClients = async (clients: any[]) => {
    if (!clients?.length) {
      toast({
        title: "Sem clientes para analisar",
        description: "Não há clientes disponíveis para análise.",
      });
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setTotal(clients.length);
    setProcessingIds(clients.map(client => client.id));
    
    const successfulReviews: string[] = [];
    const failedReviews: string[] = [];
    
    // Crie um atraso para mostrar o progresso da operação
    const processWithDelay = async () => {
      for (const client of clients) {
        try {
          await reviewClient(client.id, client[`${config.platform}_account_id`] || undefined);
          successfulReviews.push(client.company_name);
        } catch (error) {
          failedReviews.push(client.company_name);
          console.error(`Erro ao revisar cliente ${client.id}:`, error);
        }
        
        // Pequeno atraso para melhorar a experiência visual
        await new Promise(r => setTimeout(r, 300));
      }
      
      setIsProcessing(false);
      setProcessingIds([]);
      
      toast({
        title: "Revisão em massa concluída",
        description: `${successfulReviews.length} clientes revisados com sucesso${failedReviews.length > 0 ? `, ${failedReviews.length} falhas` : ''}.`,
      });
      
      if (config.onComplete) {
        config.onComplete();
      }
    };
    
    processWithDelay();
  };

  return {
    reviewClient,
    reviewAllClients,
    isProcessing,
    processingIds,
    progress,
    total
  };
}
