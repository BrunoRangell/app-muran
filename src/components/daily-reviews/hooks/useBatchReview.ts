
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientWithReview, BatchReviewResult } from "./types/reviewTypes";
import { useToast } from "@/hooks/use-toast";
import { fetchClientsWithReviews, analyzeClient } from "./services/clientReviewService";
import { supabase } from "@/lib/supabase";

// Processar clientes em paralelo com controle de concorrência
const analyzeClientsInParallel = async (
  clients: ClientWithReview[],
  batchSize: number,
  onClientStart: (clientId: string) => void,
  onClientEnd: (clientId: string) => void
): Promise<BatchReviewResult> => {
  const results = [];
  const errors = [];
  
  // Processar em lotes para limitar a concorrência
  for (let i = 0; i < clients.length; i += batchSize) {
    const currentBatch = clients.slice(i, i + batchSize);
    console.log(`Processando lote ${i / batchSize + 1} com ${currentBatch.length} clientes`);
    
    const batchPromises = currentBatch.map(async (client) => {
      try {
        onClientStart(client.id);
        const result = await analyzeClient(client.id);
        onClientEnd(client.id);
        return { clientId: client.id, result };
      } catch (error) {
        onClientEnd(client.id);
        return { 
          clientId: client.id, 
          error: {
            clientId: client.id,
            clientName: client.company_name,
            error: error instanceof Error ? error.message : "Erro desconhecido"
          }
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(item => {
      if (item.result) {
        results.push(item.result);
      } else if (item.error) {
        errors.push(item.error);
      }
    });
  }
  
  return { results, errors };
};

export const useBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  // Progresso da análise em massa
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta principal para obter clientes com revisões
  const { 
    data: clientsWithReviewsData,
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: fetchClientsWithReviews,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Consulta para obter a data da última revisão em massa
  const { data: lastBatchReviewTimeData } = useQuery({
    queryKey: ["last-batch-review-time"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .single();
      
      if (error) {
        console.error("Erro ao buscar última data de revisão:", error);
        return null;
      }
      
      if (data && data.value !== "null") {
        const timestamp = data.value;
        return new Date(timestamp);
      }
      
      return null;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Estado da última revisão em massa derivado da query
  const lastBatchReviewTime = lastBatchReviewTimeData;
  
  const clientsWithReviews = clientsWithReviewsData?.clientsData;
  
  // Função para recarregar dados
  const refetchClients = useCallback(async () => {
    console.log("Recarregando dados dos clientes...");
    await refetch();
    // Também atualizar as consultas de revisões atuais
    queryClient.invalidateQueries({ queryKey: ["client-current-reviews"] });
  }, [refetch, queryClient]);

  // Função para salvar a data da última revisão em massa
  const saveLastBatchReviewTime = async (timestamp: Date) => {
    try {
      const { error } = await supabase
        .from("system_configs")
        .update({ value: timestamp.toISOString() })
        .eq("key", "last_batch_review_time");
      
      if (error) {
        console.error("Erro ao salvar data da última revisão:", error);
      } else {
        console.log("Data da última revisão salva com sucesso:", timestamp);
        // Invalidar a consulta para garantir que os dados sejam atualizados
        queryClient.invalidateQueries({ queryKey: ["last-batch-review-time"] });
      }
    } catch (error) {
      console.error("Erro ao salvar data da última revisão:", error);
    }
  };

  // Função para revisar um único cliente - NÃO atualiza timestamp de revisão em massa
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      console.log(`Cliente ${clientId} já está em processamento.`);
      return;
    }

    try {
      setProcessingClients(prev => [...prev, clientId]);
      
      console.log(`Iniciando análise para cliente ${clientId}`);
      const result = await analyzeClient(clientId, clientsWithReviews);
      
      toast({
        title: "Análise concluída",
        description: "Orçamentos de Meta Ads atualizados com sucesso!",
      });
      
      console.log("Análise concluída com sucesso:", result);
      await refetchClients();
      
    } catch (error) {
      console.error("Erro ao analisar cliente:", error);
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido na análise do cliente.",
        variant: "destructive",
      });
      
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [processingClients, clientsWithReviews, toast, refetchClients]);

  // Função para revisar todos os clientes - atualiza o timestamp de revisão em massa
  const reviewAllClients = useCallback(async () => {
    if (isBatchAnalyzing) {
      console.log("Já existe uma análise em massa em andamento.");
      return;
    }

    if (!clientsWithReviews || clientsWithReviews.length === 0) {
      console.log("Nenhum cliente disponível para análise.");
      toast({
        title: "Nenhum cliente disponível",
        description: "Não há clientes disponíveis para analisar.",
        variant: "destructive",
      });
      return;
    }

    // Filtrar apenas clientes com ID de conta Meta configurado
    const eligibleClients = clientsWithReviews.filter(client => 
      client.meta_account_id && client.meta_account_id.trim() !== ""
    );
    
    if (eligibleClients.length === 0) {
      toast({
        title: "Nenhum cliente elegível",
        description: "Nenhum cliente com conta Meta Ads configurada.",
        variant: "destructive",
      });
      return;
    }
    
    setIsBatchAnalyzing(true);
    setBatchProgress(0);
    setTotalClientsToAnalyze(eligibleClients.length);
    
    // Atualizar o timestamp da revisão em massa para agora
    const now = new Date();
    
    // Salvar a data da última revisão no Supabase
    await saveLastBatchReviewTime(now);

    try {
      console.log("Iniciando análise em massa...");
      
      const handleClientStart = (clientId: string) => {
        setProcessingClients(prev => [...prev, clientId]);
      };
      
      const handleClientEnd = (clientId: string) => {
        setProcessingClients(prev => prev.filter(id => id !== clientId));
        // Atualizar progresso quando um cliente for concluído
        setBatchProgress(prev => {
          const newProgress = prev + 1;
          return newProgress;
        });
      };
      
      // Processar clientes em lotes paralelos com 3 clientes por vez
      const result: BatchReviewResult = await analyzeClientsInParallel(
        eligibleClients,
        3, // tamanho do lote para processamento paralelo
        handleClientStart,
        handleClientEnd
      );
      
      console.log("Análise em massa concluída:", result);
      
      const successCount = result.results.length;
      const errorCount = result.errors.length;
      
      if (successCount > 0 || errorCount > 0) {
        toast({
          title: "Análise em massa concluída",
          description: `${successCount} análises concluídas com sucesso. ${errorCount} falhas.`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Nenhum cliente analisado",
          description: "Não foi possível analisar nenhum cliente.",
          variant: "destructive",
        });
      }
      
      await refetchClients();
      
    } catch (error) {
      console.error("Erro na análise em massa:", error);
      
      toast({
        title: "Erro na análise em massa",
        description: error instanceof Error ? error.message : "Erro desconhecido na análise em massa.",
        variant: "destructive",
      });
      
    } finally {
      setIsBatchAnalyzing(false);
      setProcessingClients([]);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    }
  }, [isBatchAnalyzing, clientsWithReviews, toast, refetchClients, saveLastBatchReviewTime]);

  // Monitorar mudanças nos clientes em processamento
  useEffect(() => {
    console.log("Clientes em processamento:", processingClients);
  }, [processingClients]);

  return {
    clientsWithReviews,
    lastBatchReviewTime, // Retornamos o timestamp da revisão em massa da query
    isLoading,
    processingClients,
    isBatchAnalyzing,
    reviewSingleClient,
    reviewAllClients,
    refetchClients,
    // Informações de progresso
    batchProgress,
    totalClientsToAnalyze
  };
};

export { analyzeClientsInParallel };
