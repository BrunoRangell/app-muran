
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
      const endpoint = config.platform === "meta" ? 
        "daily-meta-review" : 
        "daily-google-review";
      
      // Construir payload
      const payload = {
        clientId,
        reviewDate,
        [config.platform === "meta" ? "metaAccountId" : "googleAccountId"]: accountId || 
          (config.platform === "meta" ? client.meta_account_id : client.google_account_id)
      };
      
      // Fazer chamada direta para a função Edge
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: payload
      });
      
      if (error) {
        throw new Error(`Erro ao processar revisão: ${error.message}`);
      }
      
      if (data && data.error) {
        throw new Error(data.error || "Erro ao processar revisão");
      }
      
      toast({
        title: "Revisão concluída",
        description: `Cliente ${client.company_name} revisado com sucesso.`,
      });
      
      return data;
    } catch (error: any) {
      console.error("Erro ao revisar cliente:", error);
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
          successfulReviews.push(client.company_name || client.id);
        } catch (error) {
          failedReviews.push(client.company_name || client.id);
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
