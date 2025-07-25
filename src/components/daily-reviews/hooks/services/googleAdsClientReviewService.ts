
import { supabase } from "@/integrations/supabase/client";
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
    daily_budget_current: Math.floor(Math.random() * 100),
    total_spent: Math.floor(Math.random() * 500),
    last_five_days_spent: Math.floor(Math.random() * 200),
    weighted_average: Math.random() * 10,
  };
};

// Função para salvar os resultados da análise no Supabase
const saveReviewResults = async (clientId: string, analysisResults: any, usingCustomBudget: boolean) => {
  const reviewDate = new Date(); // Data da revisão
  const { daily_budget_current, total_spent, last_five_days_spent, weighted_average } = analysisResults;

  // Buscar conta Meta ativa do cliente
  const { data: metaAccount } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("platform", "meta")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!metaAccount) {
    throw new Error("Cliente não possui conta Meta ativa");
  }

  const { data, error } = await supabase
    .from("budget_reviews")
    .insert([
      {
        client_id: clientId,
        account_id: metaAccount.id,
        platform: "meta",
        review_date: reviewDate.toISOString().split('T')[0],
        daily_budget_current,
        total_spent,
        last_five_days_spent,
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
  // Como não existe o campo last_review_id na tabela clients,
  // vamos apenas registrar no log do sistema
  console.log(`Revisão salva para cliente ${clientId}:`, reviewData);
};

// Serviço para realizar a revisão do cliente Google Ads
export const googleAdsClientReviewService = {
  reviewClient: async (clientId: string) => {
    try {
      // 1. Buscar dados do cliente
      const clientData = await fetchClientData(clientId);

      // Buscar orçamentos personalizados ativos
      const { data: customBudgets } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true);

      // Determinar se está usando orçamento personalizado
      let usingCustomBudget = false;
      if (customBudgets && customBudgets.length > 0) {
        const today = new Date();
        const activeBudget = customBudgets.find(budget => {
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
