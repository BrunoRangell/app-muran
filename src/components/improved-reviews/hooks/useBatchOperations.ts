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
    onSuccess: (data) => {
      setLastMetaReviewTime(data.lastMetaReviewTime);
      setLastGoogleReviewTime(data.lastGoogleReviewTime);
    },
  });

  // Mutation to update last review time for a platform
  const updateLastReviewTimeMutation = useMutation(
    async ({ platform, last_review_time }: { platform: string; last_review_time: string }) => {
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
    {
      onSuccess: () => {
        // Invalidate the query to refetch the data
        queryClient.invalidateQueries(["platform-review-times"]);
      },
    }
  );

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
