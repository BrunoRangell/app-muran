import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "../useEdgeFunction";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview, ClientAnalysisResult, BatchReviewResult } from "../types/reviewTypes";
import { AppError } from "@/lib/errors";

/**
 * Busca todos os clientes com suas respectivas revisões mais recentes
 */
export const fetchClientsWithReviews = async () => {
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
        updated_at
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
 * Analisa um cliente específico e salva a revisão no banco de dados
 */
export const analyzeClient = async (clientId: string, clientsWithReviews?: ClientWithReview[]): Promise<ClientAnalysisResult> => {
  const client = clientsWithReviews?.find(c => c.id === clientId);
  
  if (!client || !client.meta_account_id) {
    throw new Error("Cliente não encontrado ou sem ID de conta Meta");
  }
  
  console.log(`Analisando cliente: ${client.company_name} (${client.meta_account_id})`);
  
  const accessToken = await getMetaAccessToken();
  
  if (!accessToken) {
    throw new Error("Token de acesso Meta não disponível");
  }
  
  const now = getCurrentDateInBrasiliaTz();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const dateRange = {
    start: firstDayOfMonth.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
  
  console.log(`Período de análise: ${dateRange.start} até ${dateRange.end}`);
  
  const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
    body: {
      accountId: client.meta_account_id,
      accessToken,
      dateRange: dateRange,
      fetchSeparateInsights: true
    }
  });
  
  if (error) {
    console.error("Erro na função de borda:", error);
    throw new AppError(
      `Erro ao analisar cliente: ${error.message}`, 
      "EDGE_FUNCTION_ERROR",
      { originalError: error, metaAccountId: client.meta_account_id }
    );
  }
  
  if (!data) {
    throw new Error("Resposta vazia da API");
  }
  
  console.log("Dados recebidos da API Meta:", data);
  
  const currentDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
  const metaDailyBudgetCurrent = data.totalDailyBudget || 0;
  const metaTotalSpent = data.totalSpent || 0;
  
  console.log(`Valores extraídos: orçamento diário=${metaDailyBudgetCurrent}, total gasto=${metaTotalSpent}`);
  
  if (isNaN(Number(metaDailyBudgetCurrent)) || isNaN(Number(metaTotalSpent))) {
    console.error("Valores inválidos recebidos da API:", { metaDailyBudgetCurrent, metaTotalSpent });
    throw new Error("Valores inválidos recebidos da API Meta");
  }
  
  console.log("Tipo de metaDailyBudgetCurrent:", typeof metaDailyBudgetCurrent);
  console.log("Tipo de metaTotalSpent:", typeof metaTotalSpent);
  
  try {
    const { data: existingReview } = await supabase
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', client.id)
      .eq('review_date', currentDate)
      .maybeSingle();

    let reviewData;

    if (existingReview) {
      console.log("Atualizando revisão existente para hoje:", existingReview.id);
      const { data: updatedReview, error: updateError } = await supabase
        .rpc('update_daily_budget_review', {
          p_id: existingReview.id,
          p_meta_daily_budget_current: metaDailyBudgetCurrent,
          p_meta_total_spent: metaTotalSpent
        });

      if (updateError) throw updateError;
      reviewData = updatedReview;
    } else {
      console.log("Criando nova revisão para hoje");
      const { data: newReview, error: insertError } = await supabase.rpc(
        "insert_daily_budget_review",
        {
          p_client_id: client.id,
          p_review_date: currentDate,
          p_meta_daily_budget_current: metaDailyBudgetCurrent,
          p_meta_total_spent: metaTotalSpent,
          p_meta_account_id: client.meta_account_id,
          p_meta_account_name: `Conta ${client.meta_account_id}`
        }
      );
      
      if (insertError) throw insertError;
      reviewData = newReview;
    }
    
    console.log("Revisão salva/atualizada com sucesso:", reviewData);
    console.log("Valores salvos: orçamento diário =", metaDailyBudgetCurrent, "total gasto =", metaTotalSpent);
    
    return {
      clientId,
      reviewId: reviewData,
      analysis: {
        totalDailyBudget: metaDailyBudgetCurrent,
        totalSpent: metaTotalSpent,
        campaigns: data.campaignDetails || []
      }
    };
  } catch (dbError) {
    console.error("Erro ao executar operação no banco:", dbError);
    throw new Error(`Erro ao salvar/atualizar no banco de dados: ${dbError.message}`);
  }
};

/**
 * Analisa todos os clientes elegíveis em sequência
 */
export const analyzeAllClients = async (
  clientsWithReviews: ClientWithReview[] | undefined,
  onClientProcessingStart: (clientId: string) => void,
  onClientProcessingEnd: (clientId: string) => void
): Promise<BatchReviewResult> => {
  const results: ClientAnalysisResult[] = [];
  const errors: { clientId: string; clientName: string; error: string }[] = [];
  
  // Filtrar apenas clientes com ID de conta Meta configurado
  const eligibleClients = clientsWithReviews?.filter(client => 
    client.meta_account_id && client.meta_account_id.trim() !== ""
  ) || [];
  
  console.log(`Iniciando revisão em massa para ${eligibleClients.length} clientes`);
  
  // Processar clientes em sequência para evitar sobrecarga
  for (const client of eligibleClients) {
    try {
      onClientProcessingStart(client.id);
      const result = await analyzeClient(client.id, clientsWithReviews);
      results.push(result);
    } catch (error) {
      console.error(`Erro ao analisar cliente ${client.company_name}:`, error);
      errors.push({
        clientId: client.id,
        clientName: client.company_name,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      onClientProcessingEnd(client.id);
    }
  }
  
  return { results, errors };
};
