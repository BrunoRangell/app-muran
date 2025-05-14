
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type BatchOperationsPlatform = "meta" | "google";
export type BatchOperationsPriority = "sequential" | "parallel";

type BatchOperationsConfigV2 = {
  onComplete?: () => void;
  platform: BatchOperationsPlatform;
  processingStrategy?: BatchOperationsPriority;
  maxConcurrent?: number;
  useThrottling?: boolean;
  throttleDelay?: number;
};

export function useBatchOperationsV2(config: BatchOperationsConfigV2) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorIds, setErrorIds] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Configurações padrão
  const {
    platform,
    processingStrategy = "sequential",
    maxConcurrent = 3,
    useThrottling = true,
    throttleDelay = 300,
    onComplete
  } = config;

  // Iniciar processamento de um cliente específico
  const startClientProcessing = useCallback((clientId: string) => {
    setProcessingIds(prev => [...prev, clientId]);
  }, []);

  // Finalizar processamento de um cliente específico  
  const finishClientProcessing = useCallback((clientId: string, hasError: boolean = false) => {
    setProcessingIds(prev => prev.filter(id => id !== clientId));
    setProgress(prev => prev + 1);
    
    if (hasError) {
      setErrorIds(prev => [...prev, clientId]);
    }
  }, []);

  // Adicionar um atraso para controlar a taxa de requisições
  const delay = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);
  
  // Revisar um cliente específico
  const reviewClient = useCallback(async (clientId: string, accountId?: string) => {
    startClientProcessing(clientId);
    
    try {
      const reviewDate = new Date().toISOString().split("T")[0];
      
      // Obter detalhes do cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (clientError) {
        throw new Error("Cliente não encontrado");
      }
      
      // Buscar orçamento personalizado ativo, se existir
      const today = new Date().toISOString().split('T')[0];
      const { data: customBudget } = await supabase
        .from(platform === "meta" ? "meta_custom_budgets" : "custom_budgets")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();
      
      // Definir endpoint baseado na plataforma
      const endpoint = platform === "meta" ? 
        "daily-meta-review" : 
        "daily-google-review";
      
      // Construir payload
      const payload = {
        clientId,
        reviewDate,
        customBudgetId: customBudget?.id,
        [platform === "meta" ? "metaAccountId" : "googleAccountId"]: accountId || 
          (platform === "meta" ? client.meta_account_id : client.google_account_id)
      };
      
      // Fazer chamada para a função Edge
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: payload
      });
      
      if (error || (data && data.error)) {
        throw new Error(error?.message || data?.error || "Erro ao processar revisão");
      }
      
      // Atualizar cache do React Query
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      
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
      
      finishClientProcessing(clientId, true);
      throw error;
    } finally {
      finishClientProcessing(clientId);
    }
  }, [platform, startClientProcessing, finishClientProcessing, queryClient, toast]);

  // Processamento sequencial de clientes
  const processSequentially = useCallback(async (clients: any[]) => {
    const successfulReviews: string[] = [];
    const failedReviews: string[] = [];
    
    for (const client of clients) {
      try {
        await reviewClient(client.id, client[`${platform}_account_id`] || undefined);
        successfulReviews.push(client.company_name || client.id);
      } catch (error) {
        failedReviews.push(client.company_name || client.id);
      }
      
      // Pequeno atraso para melhorar a experiência visual
      if (useThrottling) {
        await delay(throttleDelay);
      }
    }
    
    return { successfulReviews, failedReviews };
  }, [platform, reviewClient, useThrottling, throttleDelay, delay]);

  // Processamento paralelo com limite de concorrência
  const processParallel = useCallback(async (clients: any[]) => {
    const successfulReviews: string[] = [];
    const failedReviews: string[] = [];
    
    // Processar em lotes para controlar concorrência
    for (let i = 0; i < clients.length; i += maxConcurrent) {
      const batch = clients.slice(i, i + maxConcurrent);
      
      const results = await Promise.allSettled(
        batch.map(client => 
          reviewClient(client.id, client[`${platform}_account_id`] || undefined)
        )
      );
      
      results.forEach((result, index) => {
        const client = batch[index];
        if (result.status === "fulfilled") {
          successfulReviews.push(client.company_name || client.id);
        } else {
          failedReviews.push(client.company_name || client.id);
        }
      });
      
      // Adicionar atraso entre lotes
      if (useThrottling && i + maxConcurrent < clients.length) {
        await delay(throttleDelay);
      }
    }
    
    return { successfulReviews, failedReviews };
  }, [platform, reviewClient, maxConcurrent, useThrottling, throttleDelay, delay]);
  
  // Revisar todos os clientes
  const reviewAllClients = useCallback(async (clients: any[]) => {
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
    setErrorIds([]);
    setProcessingIds(clients.map(client => client.id));
    
    try {
      // Escolher estratégia de processamento
      const { successfulReviews, failedReviews } = 
        processingStrategy === "sequential" 
          ? await processSequentially(clients)
          : await processParallel(clients);
      
      // Atualizar cache do React Query
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      
      toast({
        title: "Revisão em massa concluída",
        description: `${successfulReviews.length} clientes revisados com sucesso${failedReviews.length > 0 ? `, ${failedReviews.length} falhas` : ''}.`,
      });
      
      if (onComplete) {
        onComplete();
      }
    } finally {
      setIsProcessing(false);
      setProcessingIds([]);
    }
  }, [
    toast, 
    processSequentially, 
    processParallel, 
    processingStrategy, 
    queryClient,
    onComplete
  ]);

  return {
    reviewClient,
    reviewAllClients,
    isProcessing,
    processingIds,
    progress,
    total,
    errorIds
  };
}
