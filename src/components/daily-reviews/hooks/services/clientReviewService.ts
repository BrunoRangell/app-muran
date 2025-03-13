
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

/**
 * Verifica se existe um orçamento personalizado ativo para o cliente na data atual
 */
async function getActiveCustomBudget(clientId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("meta_custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();
    
  if (error) {
    console.error("Erro ao buscar orçamento personalizado:", error);
    return null;
  }
  
  return data;
}

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

  // Verificar se existe orçamento personalizado ativo
  const customBudget = await getActiveCustomBudget(clientId);
  console.log("Orçamento personalizado encontrado:", customBudget);
  
  const now = getCurrentDateInBrasiliaTz();
  
  // Definir o período de análise
  let startDate;
  if (customBudget) {
    startDate = new Date(customBudget.start_date);
    // Garantir que não buscamos dados anteriores à data de início
    if (startDate > now) {
      throw new Error("A data de início do orçamento é no futuro");
    }
  } else {
    // Caso contrário, usar o primeiro dia do mês atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  const dateRange = {
    start: startDate.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
  
  console.log(`Período de análise: ${dateRange.start} até ${dateRange.end}`);
  
  try {
    // Tentar usar a função meta-budget-calculator primeiro
    const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
      body: {
        accountId: client.meta_account_id,
        accessToken,
        dateRange: dateRange,
        fetchSeparateInsights: true
      }
    });
    
    if (error) {
      console.error("Erro na função meta-budget-calculator:", error);
      console.log("Tentando usar a função daily-budget-reviews como fallback...");
      
      // Fallback para a função daily-budget-reviews
      return await useDailyBudgetReviewsFunction(client, accessToken, dateRange, customBudget);
    }
    
    if (!data) {
      console.error("Resposta vazia da API meta-budget-calculator");
      console.log("Tentando usar a função daily-budget-reviews como fallback...");
      
      // Fallback para a função daily-budget-reviews
      return await useDailyBudgetReviewsFunction(client, accessToken, dateRange, customBudget);
    }
    
    console.log("Dados recebidos da API Meta (meta-budget-calculator):", data);
    
    const currentDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
    const metaDailyBudgetCurrent = data.totalDailyBudget || 0;
    const metaTotalSpent = data.totalSpent || 0;
    
    console.log(`Valores extraídos: orçamento diário=${metaDailyBudgetCurrent}, total gasto=${metaTotalSpent}`);
    
    if (isNaN(Number(metaDailyBudgetCurrent)) || isNaN(Number(metaTotalSpent))) {
      console.error("Valores inválidos recebidos da API:", { metaDailyBudgetCurrent, metaTotalSpent });
      throw new Error("Valores inválidos recebidos da API Meta");
    }
    
    return await saveReviewToDatabase(client, currentDate, metaDailyBudgetCurrent, metaTotalSpent, customBudget, data.campaignDetails);
  } catch (error) {
    console.error("Erro ao usar meta-budget-calculator:", error);
    console.log("Tentando usar a função daily-budget-reviews como fallback...");
    
    // Fallback para a função daily-budget-reviews
    return await useDailyBudgetReviewsFunction(client, accessToken, dateRange, customBudget);
  }
};

/**
 * Função de fallback para usar a função daily-budget-reviews
 */
async function useDailyBudgetReviewsFunction(client, accessToken, dateRange, customBudget) {
  const currentDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
  
  console.log("Usando função daily-budget-reviews como fallback");
  
  try {
    const { data, error } = await supabase.functions.invoke("daily-budget-reviews", {
      body: { 
        method: "getMetaAdsData", 
        metaAccountId: client.meta_account_id,
        accessToken,
        clientId: client.id,
        reviewDate: currentDate
      }
    });
    
    if (error) {
      console.error("Erro na função daily-budget-reviews:", error);
      throw new Error(`Erro ao analisar cliente: ${error.message}`);
    }
    
    if (!data || !data.meta_total_spent || !data.meta_daily_budget_current) {
      console.error("Dados inválidos da função daily-budget-reviews:", data);
      throw new Error("Dados inválidos recebidos da função daily-budget-reviews");
    }
    
    const metaDailyBudgetCurrent = Number(data.meta_daily_budget_current);
    const metaTotalSpent = Number(data.meta_total_spent);
    
    console.log(`Valores do fallback: orçamento diário=${metaDailyBudgetCurrent}, total gasto=${metaTotalSpent}`);
    
    return await saveReviewToDatabase(client, currentDate, metaDailyBudgetCurrent, metaTotalSpent, customBudget, data.meta?.campaigns);
  } catch (error) {
    console.error("Erro no fallback para daily-budget-reviews:", error);
    throw new Error(`Falha completa na análise do cliente: ${error.message}`);
  }
}

/**
 * Salva a revisão no banco de dados
 */
async function saveReviewToDatabase(client, currentDate, metaDailyBudgetCurrent, metaTotalSpent, customBudget, campaigns) {
  try {
    // Verificar se já existe uma revisão para hoje
    const { data: existingReview } = await supabase
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', client.id)
      .eq('review_date', currentDate)
      .maybeSingle();

    let reviewData;
    
    // Adicionar campo para informar se está usando orçamento personalizado
    const customBudgetInfo = customBudget ? {
      using_custom_budget: true,
      custom_budget_id: customBudget.id,
      custom_budget_amount: customBudget.budget_amount
    } : {
      using_custom_budget: false,
      custom_budget_id: null,
      custom_budget_amount: null
    };

    if (existingReview) {
      console.log("Atualizando revisão existente para hoje:", existingReview.id);
      const { data: updatedReview, error: updateError } = await supabase
        .from('daily_budget_reviews')
        .update({
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          ...customBudgetInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (updateError) throw updateError;
      reviewData = updatedReview;
    } else {
      console.log("Criando nova revisão para hoje");
      const { data: newReview, error: insertError } = await supabase
        .from('daily_budget_reviews')
        .insert({
          client_id: client.id,
          review_date: currentDate,
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...customBudgetInfo
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      reviewData = newReview;
    }
    
    console.log("Revisão salva/atualizada com sucesso:", reviewData);
    console.log("Valores salvos: orçamento diário =", metaDailyBudgetCurrent, "total gasto =", metaTotalSpent);
    
    return {
      clientId: client.id,
      reviewId: reviewData.id,
      analysis: {
        totalDailyBudget: metaDailyBudgetCurrent,
        totalSpent: metaTotalSpent,
        campaigns: campaigns || []
      }
    };
  } catch (dbError) {
    console.error("Erro ao executar operação no banco:", dbError);
    throw new Error(`Erro ao salvar/atualizar no banco de dados: ${dbError.message}`);
  }
}

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
