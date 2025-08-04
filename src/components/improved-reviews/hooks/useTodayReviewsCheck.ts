import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getTodayInBrazil } from "@/utils/brazilTimezone";

interface TodayReviewsStatus {
  hasMetaReviews: boolean;
  hasGoogleReviews: boolean;
  metaReviewsCount: number;
  googleReviewsCount: number;
}

export function useTodayReviewsCheck() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["today-reviews-check"],
    queryFn: async (): Promise<TodayReviewsStatus> => {
      const today = getTodayInBrazil();
      console.log("🔍 Verificando reviews para hoje:", today);

      // Verificar reviews do Meta Ads para hoje
      const { data: metaReviews, error: metaError } = await supabase
        .from("budget_reviews")
        .select("id")
        .eq("platform", "meta")
        .eq("review_date", today);

      if (metaError) {
        console.error("❌ Erro ao verificar reviews Meta:", metaError);
        throw metaError;
      }

      // Verificar reviews do Google Ads para hoje
      const { data: googleReviews, error: googleError } = await supabase
        .from("budget_reviews")
        .select("id")
        .eq("platform", "google")
        .eq("review_date", today);

      if (googleError) {
        console.error("❌ Erro ao verificar reviews Google:", googleError);
        throw googleError;
      }

      const metaReviewsCount = metaReviews?.length || 0;
      const googleReviewsCount = googleReviews?.length || 0;

      console.log("📊 Status dos reviews de hoje:", {
        today,
        metaReviewsCount,
        googleReviewsCount,
        hasMetaReviews: metaReviewsCount > 0,
        hasGoogleReviews: googleReviewsCount > 0
      });

      return {
        hasMetaReviews: metaReviewsCount > 0,
        hasGoogleReviews: googleReviewsCount > 0,
        metaReviewsCount,
        googleReviewsCount
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 2 * 60 * 1000, // 2 minutos
  });

  return {
    data: data || {
      hasMetaReviews: false,
      hasGoogleReviews: false,
      metaReviewsCount: 0,
      googleReviewsCount: 0
    },
    isLoading,
    error,
    refetch
  };
}