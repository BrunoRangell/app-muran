
import { useState, useEffect } from "react";
import { useBatchOperations } from "./useBatchOperations";

export const usePlatformBatchReviews = () => {
  const [lastMetaReviewTime, setLastMetaReviewTime] = useState<string | null>(null);
  const [lastGoogleReviewTime, setLastGoogleReviewTime] = useState<string | null>(null);
  
  const { 
    fetchBatchReviewInfo, 
    fetchGoogleBatchReviewInfo 
  } = useBatchOperations();

  const refetchBoth = async () => {
    try {
      const metaInfo = await fetchBatchReviewInfo('meta');
      const googleInfo = await fetchGoogleBatchReviewInfo();
      
      if (metaInfo) {
        setLastMetaReviewTime(metaInfo.lastBatchReviewTime);
      }
      
      if (googleInfo) {
        setLastGoogleReviewTime(googleInfo.lastBatchReviewTime);
      }
    } catch (error) {
      console.error("Erro ao buscar informações de batch:", error);
    }
  };

  useEffect(() => {
    refetchBoth();
  }, []);

  return {
    lastMetaReviewTime,
    lastGoogleReviewTime,
    refetchBoth
  };
};
