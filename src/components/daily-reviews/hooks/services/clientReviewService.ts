
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "../types/reviewTypes";
import { getCurrentDateInBrasiliaTz, calculateIdealDailyBudget, generateRecommendation } from "../../summary/utils";

/**
 * Busca clientes ativos com suas revisões mais recentes
 */
export const fetchClientsWithReviews = async (): Promise<{
  clientsData: ClientWithReview[];
  lastReviewTime: Date | null;
}> => {
  // Buscar clientes ativos que tenham ID de conta Meta configurado
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, company_name, meta_account_id, meta_ads_budget")
    .eq("status", "active")
    .not("meta_account_id", "is", null)
    .order("company_name");

  if (clientsError) {
    console.error("Erro ao buscar clientes:", clientsError);
    throw clientsError;
  }

  // Para cada cliente, buscar a revisão mais recente
  const clientsWithReviewsData = await Promise.all(
    clients.map(async (client) => {
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", client.id)
        .order("review_date", { ascending: false })
        .limit(1);

      if (reviewsError) {
        console.error(`Erro ao buscar revisões para cliente ${client.id}:`, reviewsError);
        return { ...client, lastReview: null };
      }

      // Processar a revisão mais recente para adicionar orçamento diário ideal e recomendação
      if (reviews && reviews.length > 0) {
        const review = reviews[0];
        const today = getCurrentDateInBrasiliaTz();
        const idealDailyBudget = calculateIdealDailyBudget(client.meta_ads_budget, today);
        
        // Gerar recomendação baseada na comparação entre orçamento atual e ideal
        const recommendation = generateRecommendation(
          review.meta_daily_budget_current,
          idealDailyBudget
        );
        
        return { 
          ...client, 
          lastReview: {
            ...review,
            idealDailyBudget,
            recommendation
          }
        };
      }

      return { ...client, lastReview: null };
    })
  );

  // Encontrar a data da revisão mais recente
  let lastReviewTime: Date | null = null;
  const mostRecentReview = clientsWithReviewsData
    .filter(client => client.lastReview)
    .sort((a, b) => {
      if (!a.lastReview || !b.lastReview) return 0;
      return new Date(b.lastReview.review_date).getTime() - new Date(a.lastReview.review_date).getTime();
    })[0];

  if (mostRecentReview?.lastReview) {
    // Criar um objeto Date a partir da string de data
    lastReviewTime = new Date(mostRecentReview.lastReview.review_date);
  }

  return {
    clientsData: clientsWithReviewsData as ClientWithReview[],
    lastReviewTime
  };
};
