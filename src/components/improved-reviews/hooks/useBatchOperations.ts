
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
  // Buscar a última revisão do Meta Ads
  const { data: lastMetaReview, refetch: refetchMeta } = useQuery({
    queryKey: ['last-batch-review-meta'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      console.log("🔍 Buscando última revisão em massa do Meta Ads...");
      
      const { data } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .or('details->>platform.eq.meta,details->platform.is.null') // Meta ou legado sem platform
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log("📅 Última revisão Meta encontrada:", data);
      
      return data ? {
        lastBatchReviewTime: data.created_at,
        details: data.details || {}
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Buscar a última revisão do Google Ads
  const { data: lastGoogleReview, refetch: refetchGoogle } = useQuery({
    queryKey: ['last-batch-review-google'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      console.log("🔍 Buscando última revisão em massa do Google Ads...");
      
      const { data } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .eq('details->>platform', 'google')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log("📅 Última revisão Google encontrada:", data);
      
      return data ? {
        lastBatchReviewTime: data.created_at,
        details: data.details || {}
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
}

export const useBatchOperations = ({ platform, onComplete }: UseBatchOperationsProps) => {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentClientName, setCurrentClientName] = useState<string>("");

  const reviewClient = async (clientId: string, accountId?: string) => {
    if (processingIds.includes(clientId)) return;
    
    setProcessingIds(prev => [...prev, clientId]);
    
    try {
      // Simular análise do cliente
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Cliente ${clientId} analisado com sucesso`);
    } catch (error) {
      console.error(`Erro ao analisar cliente ${clientId}:`, error);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== clientId));
    }
  };

  const reviewAllClients = async (clients: any[]) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setTotal(clients.length);
    setProgress(0);
    
    try {
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        setCurrentClientName(client.company_name);
        setProgress(i + 1);
        
        await reviewClient(client.id, client[`${platform}_account_id`]);
      }
      
      if (onComplete) {
        onComplete();
      }
    } finally {
      setIsProcessing(false);
      setCurrentClientName("");
      setProgress(0);
      setTotal(0);
    }
  };

  const cancelBatchProcessing = () => {
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
