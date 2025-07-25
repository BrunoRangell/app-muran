
import { supabase } from "@/integrations/supabase/client";
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

  // Primeiro, buscar todos os clientes ativos
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      status
    `)
    .eq('status', 'active')
    .order('company_name');
    
  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }
  
  // Agora, para cada cliente, buscar apenas a revisão mais recente
  let lastReviewTime: Date | null = null;
  const processedClients: ClientWithReview[] = [];
  
  for (const client of clientsData || []) {
    // Buscar apenas a revisão mais recente para este cliente
    const { data: reviewData, error: reviewError } = await supabase
      .from('budget_reviews')
      .select('*')
      .eq('client_id', client.id)
      .order('review_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (reviewError) {
      console.error(`Erro ao buscar revisão para cliente ${client.company_name}:`, reviewError);
      // Continuar com o próximo cliente
      processedClients.push({
        ...client,
        lastReview: null,
        status: client.status
      });
      continue;
    }
    
    // Buscar contas Meta para este cliente
    const { data: metaAccounts } = await supabase
      .from('client_accounts')
      .select('*')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .eq('status', 'active');
    
    // Buscar contas Google para este cliente
    const { data: googleAccounts } = await supabase
      .from('client_accounts')
      .select('*')
      .eq('client_id', client.id)
      .eq('platform', 'google')
      .eq('status', 'active');
    
    // Adicionar a revisão mais recente ao cliente
    processedClients.push({
      ...client,
      lastReview: reviewData ? {
        ...reviewData,
        google_daily_budget_current: reviewData.daily_budget_current || 0,
        google_total_spent: reviewData.total_spent || 0,
        meta_daily_budget_current: reviewData.daily_budget_current || 0,
        meta_total_spent: reviewData.total_spent || 0,
      } : null,
      status: client.status,
      meta_accounts: metaAccounts || [],
      google_accounts: googleAccounts || [],
    });
    
    // Atualizar o timestamp da revisão mais recente global
    if (reviewData && reviewData.created_at) {
      const reviewDate = new Date(reviewData.created_at);
      if (!lastReviewTime || reviewDate > lastReviewTime) {
        lastReviewTime = reviewDate;
      }
    }
  }
  
  console.log("Clientes processados com revisões:", processedClients?.length);
  
  return { 
    clientsData: processedClients || [],
    lastReviewTime 
  };
};
