
import { supabase } from "@/lib/supabase";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";
import { logger } from "@/utils/logger";

// Função para buscar os dados do cliente no Supabase
const fetchClientData = async (clientId: string) => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) {
    logger.error("GOOGLE_ADS_REVIEW", "Erro ao buscar dados do cliente", error);
    throw new Error(`Erro ao buscar dados do cliente: ${error.message}`);
  }

  return data;
};

// Função para simular a análise do cliente (substitua pela lógica real)
const analyzeClient = async (clientId: string) => {
  // Simulação de análise
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera de 1 segundo

  // Simulação de dados analisados
  return {
    google_daily_budget_current: Math.floor(Math.random() * 100),
    google_total_spent: Math.floor(Math.random() * 500),
    google_last_five_days_spent: Math.floor(Math.random() * 200),
    google_weighted_average: Math.random() * 10,
  };
};

// Função para salvar os resultados da análise no Supabase
const saveReviewResults = async (clientId: string, analysisResults: any, usingCustomBudget: boolean) => {
  const reviewDate = new Date(); // Data da revisão
  const { google_daily_budget_current, google_total_spent, google_last_five_days_spent } = analysisResults;

  const { data, error } = await supabase
    .from("google_ads_reviews")
    .insert([
      {
        client_id: clientId,
        review_date: reviewDate.toISOString().split('T')[0],
        google_daily_budget_current,
        google_total_spent,
        google_last_five_days_spent,
        using_custom_budget: usingCustomBudget,
      },
    ])
    .select();

  if (error) {
    logger.error("GOOGLE_ADS_REVIEW", "Erro ao salvar resultados da análise", error);
    throw new Error(`Erro ao salvar resultados da análise: ${error.message}`);
  }

  return data;
};

// Função para atualizar a tabela de clientes com os dados da última revisão
const updateClientWithLastReview = async (clientId: string, reviewData: any) => {
  // Note: removed last_review_id as it doesn't exist in the clients table schema
  logger.info("GOOGLE_ADS_REVIEW", `Review completed for client ${clientId}`, reviewData);
};

// Serviço para realizar a revisão do cliente Google Ads
export const googleAdsClientReviewService = {
  reviewClient: async (clientId: string) => {
    try {
      // 1. Buscar dados do cliente
      const clientData = await fetchClientData(clientId);

      // Determinar se está usando orçamento personalizado
      let usingCustomBudget = false;
      
      // Buscar orçamentos personalizados ativos
      const today = new Date().toISOString().split('T')[0];
      const { data: customBudgets } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("client_id", clientId)
        .eq("platform", "google")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);
        
      usingCustomBudget = customBudgets && customBudgets.length > 0;

      // 2. Simular análise do cliente
      const analysisResults = await analyzeClient(clientId);

      // 3. Salvar resultados da análise
      const reviewData = await saveReviewResults(clientId, analysisResults, usingCustomBudget);

      // 4. Atualizar cliente com os dados da última revisão
      await updateClientWithLastReview(clientId, reviewData);

      logger.info("GOOGLE_ADS_REVIEW", `Análise do cliente ${clientId} concluída com sucesso`);
    } catch (error: any) {
      logger.error("GOOGLE_ADS_REVIEW", `Erro ao analisar cliente ${clientId}`, error);
      throw new Error(`Erro ao analisar cliente ${clientId}: ${error.message}`);
    }
  },
};
