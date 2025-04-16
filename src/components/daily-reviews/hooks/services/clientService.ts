
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "../types/reviewTypes";
import { fetchClientsWithReviews as fetchClientsWithReviewsFromNewService } from "./clientReviewService";

/**
 * Busca todos os clientes com suas respectivas revisões mais recentes
 * @deprecated Use clientReviewService.fetchClientsWithReviews instead
 */
export const fetchClientsWithReviews = async () => {
  console.log("Redirecionando para o novo serviço clientReviewService.fetchClientsWithReviews");
  return fetchClientsWithReviewsFromNewService();
};
