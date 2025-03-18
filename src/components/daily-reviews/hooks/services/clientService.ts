
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "../types/reviewTypes";

/**
 * Busca todos os clientes com suas respectivas revisões mais recentes
 */
export const fetchClientsWithReviews = async () => {
  console.log("Iniciando fetchClientsWithReviews");
  // Verificar autenticação antes de fazer a requisição
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

  // Buscar todos os clientes ativos com ID de conta Meta configurado
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      meta_account_id,
      meta_ads_budget,
      daily_budget_reviews (
        id,
        review_date,
        meta_daily_budget_current,
        meta_total_spent,
        created_at,
        updated_at,
        using_custom_budget,
        custom_budget_id,
        custom_budget_amount
      )
    `)
    .eq('status', 'active')
    .order('company_name');
    
  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }
  
  // Determinar a data da revisão mais recente
  let lastReviewTime: Date | null = null;
  
  // Processar os clientes para obter apenas a revisão mais recente de cada um
  const processedClients = clientsData?.map(client => {
    let lastReview = null;
    
    // Ordenar revisões por data (mais recente primeiro)
    if (client.daily_budget_reviews && client.daily_budget_reviews.length > 0) {
      const sortedReviews = [...client.daily_budget_reviews].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      lastReview = sortedReviews[0];
      
      // Atualizar o timestamp da revisão mais recente global
      const reviewDate = new Date(lastReview.created_at);
      if (!lastReviewTime || reviewDate > lastReviewTime) {
        lastReviewTime = reviewDate;
      }
    }
    
    return {
      ...client,
      lastReview
    };
  });
  
  console.log("Clientes processados com revisões:", processedClients?.length);
  
  return { 
    clientsData: processedClients || [],
    lastReviewTime 
  };
};
