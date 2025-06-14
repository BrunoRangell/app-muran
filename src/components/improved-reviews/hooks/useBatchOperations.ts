
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";

interface ReviewTimes {
  lastMetaReviewTime: string | null;
  lastGoogleReviewTime: string | null;
}

export const usePlatformBatchReviews = () => {
  const [lastMetaReviewTime, setLastMetaReviewTime] = useState<string | null>(null);
  const [lastGoogleReviewTime, setLastGoogleReviewTime] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch last review times for both platforms
  const { refetch: fetchReviewTimes } = useQuery({
    queryKey: ["platform-review-times"],
    queryFn: async (): Promise<ReviewTimes> => {
      const { data, error } = await supabase
        .from("platform_last_review")
        .select("*");

      if (error) {
        console.error("Error fetching platform review times:", error);
        throw error;
      }

      const metaReview = data?.find((item) => item.platform === "meta")?.last_review_time || null;
      const googleReview = data?.find((item) => item.platform === "google")?.last_review_time || null;

      setLastMetaReviewTime(metaReview);
      setLastGoogleReviewTime(googleReview);

      return {
        lastMetaReviewTime: metaReview,
        lastGoogleReviewTime: googleReview,
      };
    },
  });

  // Mutation to update last review time for a platform
  const updateLastReviewTimeMutation = useMutation({
    mutationFn: async ({ platform, last_review_time }: { platform: string; last_review_time: string }) => {
      const { data, error } = await supabase
        .from("platform_last_review")
        .upsert(
          { platform, last_review_time },
          { onConflict: "platform" }
        )
        .select();

      if (error) {
        console.error(`Error updating last review time for ${platform}:`, error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["platform-review-times"] });
    },
  });

  const refetchBoth = () => {
    fetchReviewTimes();
  };

  return {
    lastMetaReviewTime,
    lastGoogleReviewTime,
    fetchReviewTimes,
    updateLastReviewTimeMutation,
    refetchBoth
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
