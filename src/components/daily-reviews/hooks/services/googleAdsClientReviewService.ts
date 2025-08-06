import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";

// Função para buscar os dados do cliente no Supabase
const fetchClientData = async (clientId: string) => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) {
    console.error("Erro ao buscar dados do cliente:", error);
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
    meta_daily_budget_current: Math.floor(Math.random() * 100),
    meta_total_spent: Math.floor(Math.random() * 500),
    meta_last_5_days_spent: Math.floor(Math.random() * 200),
    meta_weighted_average: Math.random() * 10,
  };
};

// Função para salvar os resultados da análise no Supabase
const saveReviewResults = async (clientId: string, analysisResults: any, usingCustomBudget: boolean) => {
  const reviewDate = new Date(); // Data da revisão
  const { meta_daily_budget_current, meta_total_spent, meta_last_5_days_spent, meta_weighted_average } = analysisResults;

  const { data, error } = await supabase
    .from("daily_budget_reviews")
    .insert([
      {
        client_id: clientId,
        review_date: reviewDate.toISOString(),
        meta_daily_budget_current,
        meta_total_spent,
        meta_last_5_days_spent,
        meta_weighted_average,
        using_custom_budget: usingCustomBudget,
      },
    ])
    .select();

  if (error) {
    console.error("Erro ao salvar resultados da análise:", error);
    throw new Error(`Erro ao salvar resultados da análise: ${error.message}`);
  }

  return data;
};

// Função para atualizar a tabela de clientes com os dados da última revisão
const updateClientWithLastReview = async (clientId: string, reviewData: any) => {
  const { error } = await supabase
    .from("clients")
    .update({ last_review_id: reviewData[0].id })
    .eq("id", clientId);

  if (error) {
    console.error("Erro ao atualizar cliente com última revisão:", error);
    throw new Error(`Erro ao atualizar cliente com última revisão: ${error.message}`);
  }
};

// Serviço para realizar a revisão do cliente Google Ads
export const googleAdsClientReviewService = {
  reviewClient: async (clientId: string) => {
    try {
      // 1. Buscar dados do cliente
      const clientData = await fetchClientData(clientId);

      // Determinar se está usando orçamento personalizado
      let usingCustomBudget = false;
      if (clientData.custom_budgets && clientData.custom_budgets.length > 0) {
        const today = new Date();
        const activeBudget = clientData.custom_budgets.find(budget => {
          const startDate = new Date(budget.start_date);
          const endDate = new Date(budget.end_date);
          return startDate <= today && endDate >= today;
        });
        usingCustomBudget = !!activeBudget;
      }

      // 2. Simular análise do cliente
      const analysisResults = await analyzeClient(clientId);

      // 3. Salvar resultados da análise
      const reviewData = await saveReviewResults(clientId, analysisResults, usingCustomBudget);

      // 4. Atualizar cliente com os dados da última revisão
      await updateClientWithLastReview(clientId, reviewData);

      console.log(`Análise do cliente ${clientId} concluída com sucesso.`);
    } catch (error: any) {
      console.error(`Erro ao analisar cliente ${clientId}:`, error);
      throw new Error(`Erro ao analisar cliente ${clientId}: ${error.message}`);
    }
  },
};
