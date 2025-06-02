
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
