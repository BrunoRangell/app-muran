
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "./types/reviewTypes";
import { useToast } from "@/hooks/use-toast";
import { analyzeClient, fetchClientsWithReviews } from "./services/clientReviewService";
import { getCurrentDateInBrasiliaTz } from "../summary/utils";

/**
 * Hook para gerenciar revisões em lote de clientes
 */
export const useBatchReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<string | null>(null);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  const [batchProgress, setBatchProgress] = useState(0);
  
  // Buscar a lista de clientes e suas revisões mais recentes sem refetch automático
  const { 
    data: clientsData = { clientsData: [], lastReviewTime: null }, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['clients-with-reviews'],
    queryFn: fetchClientsWithReviews,
    refetchOnWindowFocus: false, // Evita refetch ao focar na janela
    refetchOnMount: false, // Evita refetch ao montar o componente
    staleTime: Infinity, // Nunca marca os dados como desatualizados automaticamente
  });

  // Extrair os arrays de clientes do resultado
  const clientsWithReviews: ClientWithReview[] = Array.isArray(clientsData) 
    ? clientsData 
    : (clientsData?.clientsData || []);
  
  // Buscar o horário da última revisão em massa
  useEffect(() => {
    const fetchLastBatchReviewTime = async () => {
      const { data } = await supabase
        .from('system_logs')
        .select('created_at')
        .eq('event_type', 'batch_review_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLastBatchReviewTime(data.created_at);
      }
    };
    
    fetchLastBatchReviewTime();
  }, []);
  
  // Marcar que um cliente está sendo processado
  const startProcessingClient = useCallback((clientId: string) => {
    setProcessingClients(prev => [...prev, clientId]);
  }, []);
  
  // Marcar que um cliente terminou de ser processado
  const finishProcessingClient = useCallback((clientId: string) => {
    setProcessingClients(prev => prev.filter(id => id !== clientId));
  }, []);
  
  // Revisar um único cliente
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      toast({
        title: "Processamento em andamento",
        description: "Este cliente já está sendo analisado.",
        variant: "default",
      });
      return false;
    }
    
    try {
      startProcessingClient(clientId);
      
      await analyzeClient(clientId, clientsWithReviews);
      
      // Invalidar a consulta para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['latest-review', clientId] });
      
      toast({
        title: "Análise concluída",
        description: "Cliente analisado com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error("Erro ao analisar cliente:", error);
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      return false;
    } finally {
      finishProcessingClient(clientId);
    }
  }, [processingClients, startProcessingClient, finishProcessingClient, toast, clientsWithReviews, queryClient]);
  
  // Revisar todos os clientes elegíveis
  const reviewAllClients = useCallback(async () => {
    // Adicionar log no início da função
    console.log("[useBatchReview] reviewAllClients iniciando...");
    
    // Verificar se já existe uma revisão em lote em andamento
    if (isBatchAnalyzing) {
      console.log("[useBatchReview] Já existe uma revisão em andamento, cancelando nova solicitação");
      toast({
        title: "Processamento em andamento",
        description: "Já existe uma análise em lote em andamento.",
        variant: "default",
      });
      return;
    }
    
    try {
      // Filtrar clientes elegíveis (com meta_account_id configurado)
      const eligibleClients = clientsWithReviews.filter(
        client => client.meta_account_id && client.meta_account_id.trim() !== ""
      );
      
      console.log("[useBatchReview] Clientes elegíveis:", eligibleClients.length);
      
      if (eligibleClients.length === 0) {
        console.log("[useBatchReview] Nenhum cliente elegível encontrado");
        toast({
          title: "Nenhum cliente elegível",
          description: "Não há clientes com ID de conta Meta configurado.",
          variant: "default",
        });
        return;
      }
      
      setIsBatchAnalyzing(true);
      console.log("[useBatchReview] Estado isBatchAnalyzing definido como true");
      
      setTotalClientsToAnalyze(eligibleClients.length);
      setBatchProgress(0);
      console.log("[useBatchReview] Progresso inicial definido: 0/" + eligibleClients.length);
      
      // Registrar início da revisão em lote
      console.log("[useBatchReview] Iniciando chamada à função Edge para revisão em lote");
      
      try {
        // Chamada à função Edge para iniciar processamento em lote
        console.log("[useBatchReview] Enviando requisição para função Edge daily-meta-review");
        const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke(
          "daily-meta-review",
          {
            body: {
              executeReview: true,
              manual: true,
              timestamp: new Date().toISOString(),
              source: "review_all_button"
            }
          }
        );
        
        if (edgeError) {
          console.error("[useBatchReview] Erro na chamada à função Edge:", edgeError);
          throw new Error(`Erro ao iniciar revisão em lote: ${edgeError.message}`);
        }
        
        console.log("[useBatchReview] Resposta da função Edge:", edgeResponse);
        
        // Verificar resposta da função Edge
        if (!edgeResponse || !edgeResponse.success) {
          console.error("[useBatchReview] A função Edge retornou erro:", edgeResponse?.error || "Erro desconhecido");
          throw new Error("A função Edge retornou um erro ao iniciar a revisão");
        }
        
        const logId = edgeResponse.logId;
        console.log("[useBatchReview] ID do log de execução:", logId);
        
        // Atualizar informações de progresso periodicamente
        const progressInterval = setInterval(async () => {
          console.log("[useBatchReview] Verificando progresso do processamento em lote");
          
          try {
            // Buscar informações atualizadas de progresso
            const { data: batchInfo } = await supabase
              .from("system_configs")
              .select("value")
              .eq("key", "batch_review_progress")
              .single();
            
            if (batchInfo?.value) {
              console.log("[useBatchReview] Informações de progresso:", batchInfo.value);
              
              const progress = batchInfo.value.processedClients || 0;
              const total = batchInfo.value.totalClients || eligibleClients.length;
              const status = batchInfo.value.status;
              
              setBatchProgress(progress);
              setTotalClientsToAnalyze(total);
              
              console.log(`[useBatchReview] Progresso atualizado: ${progress}/${total} (${status})`);
              
              // Se o processamento foi concluído ou houve erro, parar de verificar
              if (status === 'completed' || status === 'error') {
                console.log("[useBatchReview] Processamento em lote finalizado com status:", status);
                clearInterval(progressInterval);
                setIsBatchAnalyzing(false);
                
                // Atualizar dados
                queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
                queryClient.invalidateQueries({ queryKey: ['last-batch-review-info'] });
                
                // Registrar conclusão da revisão em lote
                const now = getCurrentDateInBrasiliaTz().toISOString();
                setLastBatchReviewTime(now);
                
                // Registrar sucesso ou erro
                if (status === 'completed') {
                  console.log("[useBatchReview] Revisão em lote concluída com sucesso");
                  toast({
                    title: "Revisão em lote concluída",
                    description: `${progress} cliente(s) analisado(s) com sucesso.`,
                  });
                } else {
                  console.error("[useBatchReview] Revisão em lote concluída com erro:", batchInfo.value.error);
                  toast({
                    title: "Erro na revisão em lote",
                    description: batchInfo.value.error || "Ocorreu um erro durante o processamento",
                    variant: "destructive",
                  });
                }
              }
            }
          } catch (progressError) {
            console.error("[useBatchReview] Erro ao verificar progresso:", progressError);
          }
        }, 5000); // Verificar a cada 5 segundos
        
        // Parar de verificar após 5 minutos para evitar loop infinito em caso de erro
        setTimeout(() => {
          console.log("[useBatchReview] Tempo limite de verificação de progresso atingido");
          clearInterval(progressInterval);
          
          if (isBatchAnalyzing) {
            console.log("[useBatchReview] Encerrando estado de análise após timeout");
            setIsBatchAnalyzing(false);
            
            // Atualizar dados
            queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
            
            toast({
              title: "Status de revisão desconhecido",
              description: "O tempo limite para verificação do progresso foi atingido. Verifique o status na lista de clientes.",
              variant: "default",
            });
          }
        }, 5 * 60 * 1000);
        
        toast({
          title: "Revisão em lote iniciada",
          description: `Iniciando análise de ${eligibleClients.length} cliente(s).`,
        });
      } catch (edgeFunctionError) {
        console.error("[useBatchReview] Erro ao chamar função Edge:", edgeFunctionError);
        
        // Se ocorrer um erro na chamada à função Edge, tentar o método antigo (processamento local)
        console.log("[useBatchReview] Tentando método alternativo de processamento em lote");
        await processClientsLocally(eligibleClients);
      }
    } catch (error) {
      console.error("[useBatchReview] Erro na revisão em lote:", error);
      
      setIsBatchAnalyzing(false);
      console.log("[useBatchReview] Estado isBatchAnalyzing redefinido como false após erro");
      
      toast({
        title: "Erro na revisão em lote",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  }, [clientsWithReviews, isBatchAnalyzing, toast, queryClient]);
  
  // Método secundário de processamento (caso a chamada Edge falhe)
  const processClientsLocally = async (eligibleClients: ClientWithReview[]) => {
    console.log("[useBatchReview] Iniciando processamento local de clientes:", eligibleClients.length);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Processar cada cliente em sequência
    for (const client of eligibleClients) {
      try {
        console.log(`[useBatchReview] Processando cliente ${client.id} (${client.company_name})`);
        startProcessingClient(client.id);
        await analyzeClient(client.id, clientsWithReviews);
        successCount++;
        console.log(`[useBatchReview] Cliente ${client.id} processado com sucesso`);
        setBatchProgress(prev => prev + 1);
      } catch (error) {
        console.error(`[useBatchReview] Erro ao analisar cliente ${client.company_name}:`, error);
        errorCount++;
        setBatchProgress(prev => prev + 1);
      } finally {
        finishProcessingClient(client.id);
      }
    }
    
    console.log(`[useBatchReview] Processamento local concluído: ${successCount} sucesso(s), ${errorCount} erro(s)`);
    
    // Registrar conclusão da revisão em lote
    const now = getCurrentDateInBrasiliaTz().toISOString();
    setLastBatchReviewTime(now);
    
    await supabase.from('system_logs').insert({
      event_type: 'batch_review_completed',
      message: `Revisão em lote concluída: ${successCount} sucesso(s), ${errorCount} erro(s)`,
      details: { successCount, errorCount, localProcessing: true }
    });
    
    // Recarregar dados
    queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
    
    setIsBatchAnalyzing(false);
    console.log("[useBatchReview] Estado isBatchAnalyzing redefinido como false após processamento local");
    
    toast({
      title: "Revisão em lote concluída",
      description: `${successCount} cliente(s) analisado(s) com sucesso. ${errorCount} erro(s).`,
    });
  };
  
  return {
    clientsWithReviews,
    isLoading,
    error,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    refetchClients: refetch
  };
};
