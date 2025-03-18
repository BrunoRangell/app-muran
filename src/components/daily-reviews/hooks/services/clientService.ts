
import { supabase } from "@/lib/supabase";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview, BatchReviewResult } from "../types/reviewTypes";
import { analyzeClient as clientAnalysisService } from "./clientAnalysisService";

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
        custom_budget_amount,
        custom_budget_end_date
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

/**
 * Analisa um cliente específico
 */
export const analyzeClient = async (clientId: string, clientsWithReviews?: ClientWithReview[]) => {
  console.log(`Analisando cliente: ${clientId}`);
  try {
    return await clientAnalysisService(clientId, clientsWithReviews);
  } catch (error) {
    console.error("Erro ao analisar cliente:", error);
    throw error;
  }
};

/**
 * Analisa todos os clientes elegíveis
 */
export const analyzeAllClients = async (
  clients: ClientWithReview[],
  onClientStart?: (clientId: string) => void,
  onClientEnd?: (clientId: string) => void
): Promise<BatchReviewResult> => {
  console.log("Iniciando análise em massa de clientes...");
  
  const results: any[] = [];
  const errors: any[] = [];
  
  // Filtrar apenas clientes com ID de conta Meta configurado
  const eligibleClients = clients.filter(client => 
    client.meta_account_id && client.meta_account_id.trim() !== ""
  );
  
  console.log(`${eligibleClients.length} clientes elegíveis para análise`);
  
  // Processar cliente a cliente
  for (const client of eligibleClients) {
    try {
      if (onClientStart) {
        onClientStart(client.id);
      }
      
      console.log(`Analisando cliente: ${client.company_name}`);
      const result = await analyzeClient(client.id, clients);
      results.push(result);
      
    } catch (error) {
      console.error(`Erro ao analisar ${client.company_name}:`, error);
      errors.push({
        clientId: client.id,
        clientName: client.company_name,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      if (onClientEnd) {
        onClientEnd(client.id);
      }
    }
  }
  
  console.log(`Análise em massa concluída: ${results.length} sucessos, ${errors.length} falhas`);
  
  return {
    results,
    errors
  };
};
