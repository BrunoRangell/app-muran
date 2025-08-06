
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
  const processedClients = [];
  
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
        lastReview: null
      });
      continue;
    }
    
    // Adicionar a revisão mais recente ao cliente
    processedClients.push({
      ...client,
      lastReview: reviewData
    });
    
    // Atualizar o timestamp da revisão mais recente global
    if (reviewData) {
      const reviewDate = new Date(reviewData.created_at);
      if (!lastReviewTime || reviewDate > lastReviewTime) {
        lastReviewTime = reviewDate;
      }
    }
  }
  
  console.log("Clientes processados com revisões:", processedClients?.length);
  
  return { 
    clientsData: processedClients as ClientWithReview[] || [],
    lastReviewTime 
  };
};
