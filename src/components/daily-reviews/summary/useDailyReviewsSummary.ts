
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateIdealDailyBudget, generateRecommendation } from "./utils";
import { formatInTimeZone } from "date-fns-tz";

export interface ReviewData {
  id: string;
  review_date: string;
  meta_daily_budget_current: number | null;
  meta_total_spent: number;
  clients: {
    company_name: string;
    meta_ads_budget: number;
  };
  idealDailyBudget?: number;  // Marcado como opcional para compatibilidade
  recommendation?: string | null;
}

export const useDailyReviewsSummary = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-reviews-summary"],
    queryFn: async () => {
      // Obter a data atual no fuso horário de Brasília
      const today = formatInTimeZone(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
      
      // Buscamos as revisões de hoje
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select(`
          *,
          clients(company_name, meta_ads_budget)
        `)
        .eq("review_date", today);

      if (reviewsError) throw reviewsError;
      
      // Enriquecemos os dados com cálculos dinâmicos
      const enrichedReviews = reviews.map(review => {
        const idealDaily = calculateIdealDailyBudget(
          review.clients?.meta_ads_budget || 0,
          new Date(review.review_date)
        );
        
        const recommendation = generateRecommendation(
          review.meta_daily_budget_current || 0,
          idealDaily
        );
        
        return {
          ...review,
          idealDailyBudget: idealDaily,
          recommendation
        };
      });
      
      return enrichedReviews as ReviewData[];
    },
  });

  // Agrupar recomendações
  const increases = data?.filter(r => r.recommendation?.includes("Aumentar")).length || 0;
  const decreases = data?.filter(r => r.recommendation?.includes("Diminuir")).length || 0;
  const maintains = data?.filter(r => r.recommendation?.includes("Manter")).length || 0;

  // Calcular totais
  const totalMonthlyBudget = data?.reduce((sum, item) => sum + (item.clients?.meta_ads_budget || 0), 0) || 0;
  const totalSpent = data?.reduce((sum, item) => sum + (item.meta_total_spent || 0), 0) || 0;

  return {
    data,
    isLoading,
    increases,
    decreases,
    maintains,
    totalMonthlyBudget,
    totalSpent
  };
};
