
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { reviewClient as reviewClientUnified, reviewAllClients as reviewAllClientsUnified } from "@/components/common/services/unifiedReviewService";

interface BatchReviewInfo {
  lastBatchReviewTime: string;
  details: {
    platform: string;
    successCount: number;
    errorCount: number;
    totalClients: number;
    completedAt: string;
  };
}

export const usePlatformBatchReviews = () => {
  // Buscar a última revisão do Meta Ads (nova tabela batch_review_logs)
  const { data: lastMetaReview, refetch: refetchMeta } = useQuery({
    queryKey: ['last-batch-review-meta'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      console.log("🔍 Buscando última revisão em massa do Meta Ads...");
      
      // Primeiro tenta buscar na nova tabela
      const { data: newData } = await supabase
        .from('batch_review_logs')
        .select('created_at, platform, success_count, error_count, total_clients')
        .eq('platform', 'meta')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (newData) {
        console.log("📅 Última revisão Meta encontrada (nova tabela):", newData);
        return {
          lastBatchReviewTime: newData.created_at,
          details: {
            platform: newData.platform,
            successCount: newData.success_count,
            errorCount: newData.error_count,
            totalClients: newData.total_clients,
            completedAt: newData.created_at
          }
        };
      }
      
      // Fallback para tabela antiga
      const { data: oldData } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .or('details->>platform.eq.meta,details->platform.is.null')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log("📅 Última revisão Meta encontrada (tabela antiga):", oldData);
      
      return oldData ? {
        lastBatchReviewTime: oldData.created_at,
        details: (oldData.details as any) || {}
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Buscar a última revisão do Google Ads (nova tabela batch_review_logs)
  const { data: lastGoogleReview, refetch: refetchGoogle } = useQuery({
    queryKey: ['last-batch-review-google'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      console.log("🔍 Buscando última revisão em massa do Google Ads...");
      
      // Primeiro tenta buscar na nova tabela
      const { data: newData } = await supabase
        .from('batch_review_logs')
        .select('created_at, platform, success_count, error_count, total_clients')
        .eq('platform', 'google')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (newData) {
        console.log("📅 Última revisão Google encontrada (nova tabela):", newData);
        return {
          lastBatchReviewTime: newData.created_at,
          details: {
            platform: newData.platform,
            successCount: newData.success_count,
            errorCount: newData.error_count,
            totalClients: newData.total_clients,
            completedAt: newData.created_at
          }
        };
      }
      
      // Fallback para tabela antiga
      const { data: oldData } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .eq('details->>platform', 'google')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log("📅 Última revisão Google encontrada (tabela antiga):", oldData);
      
      return oldData ? {
        lastBatchReviewTime: oldData.created_at,
        details: (oldData.details as any) || {}
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos
  });

  return {
    lastMetaReviewTime: lastMetaReview?.lastBatchReviewTime || null,
    lastGoogleReviewTime: lastGoogleReview?.lastBatchReviewTime || null,
    metaReviewDetails: lastMetaReview?.details || null,
    googleReviewDetails: lastGoogleReview?.details || null,
    refetchMeta,
    refetchGoogle,
    refetchBoth: () => {
      refetchMeta();
      refetchGoogle();
    }
  };
};

interface UseBatchOperationsProps {
  platform: "meta" | "google";
  onComplete?: () => void;
  onIndividualComplete?: () => void; // NOVO: callback para revisões individuais
}

export const useBatchOperations = ({ platform, onComplete, onIndividualComplete }: UseBatchOperationsProps) => {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentClientName, setCurrentClientName] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateAllQueries = async () => {
    console.log("🔄 Invalidando todas as queries relevantes...");
    
    // Invalidar queries principais
    await queryClient.invalidateQueries({ queryKey: ["improved-meta-reviews"] });
    await queryClient.invalidateQueries({ queryKey: ["improved-google-reviews"] });
    await queryClient.invalidateQueries({ queryKey: ["unified-reviews-data"] });
    await queryClient.invalidateQueries({ queryKey: ["last-batch-review-meta"] });
    await queryClient.invalidateQueries({ queryKey: ["last-batch-review-google"] });
    
    // Invalidar queries do sistema unificado
    await queryClient.invalidateQueries({ queryKey: ["real-time-data"] });
    
    console.log("✅ Queries invalidadas com sucesso");
  };

  const reviewClient = async (clientId: string, accountId?: string) => {
    if (processingIds.includes(clientId)) return;
    
    console.log(`🔍 [UNIFIED] Iniciando revisão individual do cliente ${clientId} (plataforma: ${platform})`);
    setProcessingIds(prev => [...prev, clientId]);
    
    try {
      // MIGRAÇÃO: Usar função unificada para revisões individuais
      const result = await reviewClientUnified({
        clientId,
        accountId,
        platform
      });
      
      console.log(`✅ [UNIFIED] Cliente ${clientId} analisado com sucesso:`, result);
      
      // Invalidar queries após revisão individual
      await invalidateAllQueries();
      
      // Chamar callback específico para revisões individuais
      if (onIndividualComplete) {
        console.log(`🔄 Executando callback de revisão individual para ${platform}`);
        onIndividualComplete();
      }
      
    } catch (error) {
      console.error(`❌ [UNIFIED] Erro ao analisar cliente ${clientId}:`, error);
      toast({
        title: "Erro na revisão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== clientId));
    }
  };

  const reviewAllClients = async (clients: any[]) => {
    if (isProcessing) return;
    
    console.log(`🚀 [UNIFIED] Iniciando revisão em massa de ${clients.length} clientes (${platform})`);
    setIsProcessing(true);
    setTotal(clients.length);
    setProgress(0);
    
    try {
      // MIGRAÇÃO: Usar função unificada para revisões em massa
      const result = await reviewAllClientsUnified(clients, platform, () => {
        if (onComplete) onComplete();
      });
      
      console.log(`✅ [UNIFIED] Revisão em massa concluída:`, result);
      
      // Invalidar queries após revisão em massa
      await invalidateAllQueries();
      
      toast({
        title: "Revisão em massa concluída",
        description: `${result.successCount} clientes analisados com sucesso, ${result.errorCount} falhas.`,
      });
      
    } catch (error) {
      console.error(`❌ [UNIFIED] Erro na revisão em massa:`, error);
      toast({
        title: "Erro na revisão em massa",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentClientName("");
      setProgress(0);
      setTotal(0);
    }
  };

  const cancelBatchProcessing = () => {
    console.log("🛑 Cancelando processamento em massa");
    setIsProcessing(false);
    setProcessingIds([]);
    setCurrentClientName("");
    setProgress(0);
    setTotal(0);
  };

  return {
    processingIds,
    reviewClient,
    reviewAllClients,
    cancelBatchProcessing,
    isProcessing,
    progress,
    total,
    currentClientName
  };
};
