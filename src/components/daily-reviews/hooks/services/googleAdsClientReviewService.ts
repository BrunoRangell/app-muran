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
    .from("budget_reviews")
    .insert([
      {
        client_id: clientId,
        account_id: 'google-account',
        review_date: reviewDate.toISOString(),
        platform: 'google',
        daily_budget_current: meta_daily_budget_current,
        total_spent: meta_total_spent,
        last_five_days_spent: meta_last_5_days_spent,
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
  // This function is not needed as clients table doesn't have last_review_id field
  // Just return success
  return true;
};

// Serviço para realizar a revisão do cliente Google Ads
export const googleAdsClientReviewService = {
  reviewClient: async (clientId: string) => {
    try {
      // 1. Buscar dados do cliente
      const clientData = await fetchClientData(clientId);

      // Determinar se está usando orçamento personalizado buscando na tabela custom_budgets
      let usingCustomBudget = false;
      const today = new Date();
      const { data: customBudgets } = await supabase
        .from('custom_budgets')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .lte('start_date', today.toISOString().split('T')[0])
        .gte('end_date', today.toISOString().split('T')[0]);
      
      usingCustomBudget = customBudgets && customBudgets.length > 0;

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
