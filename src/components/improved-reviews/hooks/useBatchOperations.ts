
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
      
      // Construir payload com fetchRealData sempre true para Meta Ads
      const payload = {
        clientId,
        reviewDate,
        [config.platform === "meta" ? "metaAccountId" : "googleAccountId"]: accountId || 
          (config.platform === "meta" ? client.meta_account_id : client.google_account_id),
        // Sempre tentar buscar dados reais para Meta Ads
        ...(config.platform === "meta" && {
          fetchRealData: true,
          clientName: client.company_name
        })
      };
      
      console.log(`[useBatchOperations] Enviando payload para ${endpoint}:`, {
        ...payload,
        accessToken: "***REDACTED***" // Não logar o token
      });
      
      // Fazer chamada direta para a função Edge
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: payload
      });
      
      if (error) {
        console.error(`[useBatchOperations] Erro ao processar revisão:`, error);
        
        // Tratamento específico para erros de orçamento personalizado no Google Ads
        if (config.platform === "google" && error.message?.includes("violates foreign key constraint")) {
          console.warn(`[useBatchOperations] Erro de orçamento personalizado detectado para cliente ${clientId} - continuando...`);
          
          toast({
            title: "Aviso - Orçamento personalizado",
            description: `Cliente ${client.company_name}: problema com orçamento personalizado, mas revisão foi salva.`,
            variant: "default",
          });
          
          return { reviewId: null, warning: "custom_budget_error" };
        }
        
        throw new Error(`Erro ao processar revisão: ${error.message}`);
      }
      
      if (data && data.error) {
        console.error(`[useBatchOperations] Erro retornado pela função:`, data);
        
        // Tratamento específico para erros de orçamento personalizado no Google Ads
        if (config.platform === "google" && data.error?.includes("violates foreign key constraint")) {
          console.warn(`[useBatchOperations] Erro de orçamento personalizado detectado para cliente ${clientId} - continuando...`);
          
          toast({
            title: "Aviso - Orçamento personalizado",
            description: `Cliente ${client.company_name}: problema com orçamento personalizado, mas revisão foi salva.`,
            variant: "default",
          });
          
          return { reviewId: null, warning: "custom_budget_error" };
        }
        
        throw new Error(data.error || "Erro ao processar revisão");
      }
      
      // Log do resultado para debugging
      console.log(`[useBatchOperations] Revisão concluída para ${client.company_name}:`, {
        reviewId: data?.reviewId,
        dataSource: data?.dataSource,
        totalSpent: data?.totalSpent,
        idealDailyBudget: data?.idealDailyBudget
      });
      
      toast({
        title: "Revisão concluída",
        description: `Cliente ${client.company_name} revisado com sucesso.`,
      });
      
      return data;
    } catch (error: any) {
      console.error(`[useBatchOperations] Erro ao revisar cliente ${clientId}:`, error);
      
      // Não mostrar toast de erro para problemas de orçamento personalizado já tratados
      if (!error.message?.includes("custom_budget_error")) {
        toast({
          title: "Erro na revisão",
          description: error.message || "Ocorreu um erro ao revisar o cliente",
          variant: "destructive",
        });
      }
      
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
    
    console.log(`[useBatchOperations] Iniciando revisão em lote de ${clients.length} clientes para ${config.platform}`);
    
    setIsProcessing(true);
    setProgress(0);
    setTotal(clients.length);
    setProcessingIds(clients.map(client => client.id));
    
    const successfulReviews: string[] = [];
    const failedReviews: string[] = [];
    const warningReviews: string[] = [];
    
    // Crie um atraso para mostrar o progresso da operação
    const processWithDelay = async () => {
      for (const client of clients) {
        try {
          console.log(`[useBatchOperations] Processando cliente: ${client.company_name || client.id}`);
          const result = await reviewClient(client.id, client[`${config.platform}_account_id`] || undefined);
          
          if (result?.warning === "custom_budget_error") {
            warningReviews.push(client.company_name || client.id);
          } else {
            successfulReviews.push(client.company_name || client.id);
          }
        } catch (error) {
          failedReviews.push(client.company_name || client.id);
          console.error(`[useBatchOperations] Erro ao revisar cliente ${client.id}:`, error);
        }
        
        // Pequeno atraso para melhorar a experiência visual
        await new Promise(r => setTimeout(r, 300));
      }
      
      console.log(`[useBatchOperations] Revisão em lote concluída:`, {
        successful: successfulReviews.length,
        warnings: warningReviews.length,
        failed: failedReviews.length,
        platform: config.platform
      });
      
      setIsProcessing(false);
      setProcessingIds([]);
      
      // Construir mensagem de resultado
      let description = `${successfulReviews.length} clientes revisados com sucesso`;
      if (warningReviews.length > 0) {
        description += `, ${warningReviews.length} com avisos`;
      }
      if (failedReviews.length > 0) {
        description += `, ${failedReviews.length} falhas`;
      }
      description += '.';
      
      toast({
        title: "Revisão em massa concluída",
        description,
        variant: failedReviews.length > 0 ? "destructive" : "default",
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
