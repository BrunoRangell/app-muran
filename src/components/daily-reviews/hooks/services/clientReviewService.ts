
import { supabase } from "@/lib/supabase";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { prepareCustomBudgetInfo } from "./customBudgetService";
import { ClientWithReview, BatchReviewResult } from "../types/reviewTypes";

/**
 * Busca todos os clientes com suas últimas revisões
 */
export async function fetchClientsWithReviews() {
  try {
    // Obter todos os clientes
    const { data: clientsData, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .order("company_name");

    if (clientsError) throw clientsError;

    // Obter a última revisão para cada cliente
    const today = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("meta_reviews")
      .select("*")
      .eq("review_date", today);

    if (reviewsError) throw reviewsError;

    // Mapear revisões para clientes
    const clientsWithReviews = clientsData.map(client => {
      const lastReview = reviewsData.find(review => review.client_id === client.id);
      return {
        ...client,
        lastReview
      };
    });

    // Obter o timestamp da última revisão em massa
    const lastReviewTime = reviewsData.length > 0 
      ? new Date(Math.max(...reviewsData.map(r => new Date(r.updated_at).getTime())))
      : null;

    return { clientsData: clientsWithReviews, lastReviewTime };
  } catch (error) {
    console.error("Erro ao buscar clientes com revisões:", error);
    throw error;
  }
}

/**
 * Analisa um único cliente e gera sua revisão
 */
export async function analyzeClient(clientId: string, clientsWithReviews?: ClientWithReview[]) {
  // Implementação para análise de um único cliente
  // Por enquanto apenas retornando um objeto simulado
  return {
    clientId,
    success: true,
    message: "Cliente analisado com sucesso"
  };
}

/**
 * Analisa todos os clientes elegíveis e gera revisões
 */
export async function analyzeAllClients(
  clients: ClientWithReview[],
  onClientStart?: (clientId: string) => void,
  onClientEnd?: (clientId: string) => void
): Promise<BatchReviewResult> {
  // Implementação para análise em massa
  // Por enquanto apenas retornando objeto simulado
  return {
    results: clients.map(client => ({
      clientId: client.id,
      reviewId: 0,
      analysis: {
        totalDailyBudget: 0,
        totalSpent: 0
      }
    })),
    errors: []
  };
}

/**
 * Salva uma nova revisão de orçamento para um cliente
 */
export async function saveClientReview(clientId: string, reviewData: any, customBudget: any = null) {
  try {
    console.log(`Salvando revisão para cliente ${clientId}`);
    const reviewDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
    
    // Verificar se há orçamento personalizado ativo
    const customBudgetInfo = prepareCustomBudgetInfo(customBudget);
    
    // Verificar se precisa de ajuste de orçamento (diferença >= 5)
    const currentDailyBudget = reviewData.meta_daily_budget_current || 0;
    const idealDailyBudget = reviewData.meta_daily_budget_ideal || 0;
    const budgetDifference = idealDailyBudget - currentDailyBudget;
    const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;
    
    // Preparar dados para inserção
    const reviewPayload = {
      client_id: clientId,
      review_date: reviewDate,
      ...reviewData,
      ...customBudgetInfo,
      // Adicionar campo de ajuste necessário
      needsBudgetAdjustment
    };
    
    // Inserir na tabela de revisões
    const { data, error } = await supabase
      .from("meta_reviews")
      .insert(reviewPayload)
      .select("*")
      .single();
      
    if (error) {
      console.error("Erro ao salvar revisão:", error);
      throw error;
    }
    
    console.log("Revisão salva com sucesso:", data);
    return data;
  } catch (error) {
    console.error("Erro ao salvar revisão:", error);
    throw error;
  }
}
