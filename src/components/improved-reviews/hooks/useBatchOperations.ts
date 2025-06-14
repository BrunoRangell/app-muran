
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

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
  const { data: lastMetaReview, refetch: refetchMeta } = useQuery({
    queryKey: ['last-batch-review-meta'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      logger.info('BATCH', 'Fetching last Meta Ads batch review');
      
      const { data } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .or('details->>platform.eq.meta,details->platform.is.null')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data ? {
        lastBatchReviewTime: data.created_at,
        details: data.details || {}
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  const { data: lastGoogleReview, refetch: refetchGoogle } = useQuery({
    queryKey: ['last-batch-review-google'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      logger.info('BATCH', 'Fetching last Google Ads batch review');
      
      const { data } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .eq('details->>platform', 'google')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data ? {
        lastBatchReviewTime: data.created_at,
        details: data.details || {}
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
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
}

export const useBatchOperations = ({ platform, onComplete }: UseBatchOperationsProps) => {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentClientName, setCurrentClientName] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reviewClient = async (clientId: string, accountId?: string) => {
    if (processingIds.includes(clientId)) return;
    
    logger.info('BATCH', `Starting review for client ${clientId} (platform: ${platform})`);
    setProcessingIds(prev => [...prev, clientId]);
    
    try {
      const functionName = platform === "meta" ? "daily-meta-review" : "daily-google-review";
      const body = {
        clientId,
        reviewDate: new Date().toISOString().split('T')[0],
        fetchRealData: true,
        ...(platform === "meta" ? { metaAccountId: accountId } : { googleAccountId: accountId })
      };

      const { data, error } = await supabase.functions.invoke(functionName, { body });
      
      if (error) throw error;
      logger.info('BATCH', `Client ${clientId} reviewed successfully`);
      
    } catch (error) {
      logger.error('BATCH', `Error reviewing client ${clientId}`, error);
      toast({
        title: "Erro na análise",
        description: `Erro ao analisar cliente: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== clientId));
    }
  };

  const reviewAllClients = async (clients: any[]) => {
    if (isProcessing) return;
    
    logger.info('BATCH', `Starting batch review of ${clients.length} clients (${platform})`);
    setIsProcessing(true);
    setTotal(clients.length);
    setProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        setCurrentClientName(client.company_name || `Cliente ${i + 1}`);
        setProgress(i + 1);
        
        try {
          const accountId = platform === "meta" 
            ? client.meta_account_id 
            : client.google_account_id;
            
          await reviewClient(client.id, accountId);
          successCount++;
        } catch (error) {
          logger.error('BATCH', `Error in client ${client.company_name}`, error);
          errorCount++;
        }
      }
      
      await logBatchCompletion(platform, successCount, errorCount, clients.length);
      await invalidateQueries(queryClient);
      
      toast({
        title: "Revisão em massa concluída",
        description: `${successCount} clientes analisados com sucesso, ${errorCount} falhas.`,
      });
      
      if (onComplete) {
        onComplete();
      }
    } finally {
      resetBatchState();
    }
  };

  const cancelBatchProcessing = () => {
    logger.info('BATCH', 'Cancelling batch processing');
    resetBatchState();
  };

  const resetBatchState = () => {
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

// Função auxiliar para registrar conclusão do batch
async function logBatchCompletion(platform: string, successCount: number, errorCount: number, totalClients: number) {
  await supabase.from('system_logs').insert({
    event_type: 'batch_review_completed',
    message: `Revisão em massa ${platform} concluída`,
    details: {
      platform,
      successCount,
      errorCount,
      totalClients,
      completedAt: new Date().toISOString()
    }
  });
}

// Função auxiliar para invalidar queries
async function invalidateQueries(queryClient: any) {
  await queryClient.invalidateQueries({ queryKey: ["improved-meta-reviews"] });
  await queryClient.invalidateQueries({ queryKey: ["improved-google-reviews"] });
  await queryClient.invalidateQueries({ queryKey: ["unified-reviews-data"] });
  await queryClient.invalidateQueries({ queryKey: ["last-batch-review-meta"] });
  await queryClient.invalidateQueries({ queryKey: ["last-batch-review-google"] });
}
