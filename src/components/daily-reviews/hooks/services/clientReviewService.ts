
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "../useEdgeFunction";
import { getCurrentDateInBrasiliaTz, getRemainingDaysInMonth } from "../../summary/utils";
import { ClientWithReview, ClientAnalysisResult, BatchReviewResult } from "../types/reviewTypes";
import { AppError } from "@/lib/errors";

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
        needs_budget_adjustment,
        budget_difference,
        ideal_daily_budget
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
 * Calcula o orçamento diário ideal com base no orçamento, gasto e dias restantes 
 */
function calculateIdealDailyBudget(totalBudget: number, totalSpent: number, daysRemaining: number): number {
  const budgetRemaining = totalBudget - totalSpent;
  return daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;
}

/**
 * Calcula o número de dias restantes no período (mês ou período personalizado)
 */
function calculateRemainingDays(customBudget: any | null): number {
  if (customBudget) {
    // Para orçamento personalizado, calcular dias entre hoje e a data final
    const today = getCurrentDateInBrasiliaTz();
    const endDate = new Date(customBudget.end_date);
    
    // +1 para incluir o dia atual E o dia final
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Garantir que retorne pelo menos 1 dia (hoje)
    return Math.max(1, diffDays);
  }
  
  // Para orçamento regular, usar os dias restantes no mês
  return getRemainingDaysInMonth();
}

/**
 * Analisa um cliente específico e salva a revisão no banco de dados
 */
export const analyzeClient = async (clientId: string, clientsWithReviews?: ClientWithReview[]): Promise<ClientAnalysisResult> => {
  // Verificar autenticação
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

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
    // Verificar se já existe uma revisão para hoje
    const { data: existingReview } = await supabase
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', client.id)
      .eq('review_date', currentDate)
      .maybeSingle();

    let reviewData;
    
    // Calcular valores para orçamento ideal e ajustes
    const totalBudget = customBudget ? customBudget.budget_amount : client.meta_ads_budget || 0;
    const daysRemaining = calculateRemainingDays(customBudget);
    const idealDailyBudget = calculateIdealDailyBudget(totalBudget, metaTotalSpent, daysRemaining);
    const budgetDifference = idealDailyBudget - metaDailyBudgetCurrent;
    const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;
    
    console.log("Cálculos de orçamento:", {
      totalBudget,
      daysRemaining,
      idealDailyBudget,
      budgetDifference,
      needsBudgetAdjustment
    });

    // Adicionar campo para informar se está usando orçamento personalizado
    const reviewDataToUpdate = {
      meta_daily_budget_current: metaDailyBudgetCurrent,
      meta_total_spent: metaTotalSpent,
      updated_at: new Date().toISOString(),
      // Campos de orçamento personalizado
      using_custom_budget: !!customBudget,
      custom_budget_id: customBudget ? customBudget.id : null,
      custom_budget_amount: customBudget ? customBudget.budget_amount : null,
      // Campos calculados para facilitar a ordenação e filtragem
      ideal_daily_budget: idealDailyBudget,
      budget_difference: budgetDifference,
      needs_budget_adjustment: needsBudgetAdjustment
    };

    if (existingReview) {
      console.log("Atualizando revisão existente para hoje:", existingReview.id);
      const { data: updatedReview, error: updateError } = await supabase
        .from('daily_budget_reviews')
        .update(reviewDataToUpdate)
        .eq('id', existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError);
        throw updateError;
      }
      reviewData = updatedReview;
    } else {
      console.log("Criando nova revisão para hoje");
      const { data: newReview, error: insertError } = await supabase
        .from('daily_budget_reviews')
        .insert({
          client_id: client.id,
          review_date: currentDate,
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...reviewDataToUpdate
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Erro ao inserir revisão:", insertError);
        throw insertError;
      }
      reviewData = newReview;
    }
    
    console.log("Revisão salva/atualizada com sucesso:", reviewData);
    console.log("Valores salvos: orçamento diário =", metaDailyBudgetCurrent, "total gasto =", metaTotalSpent);
    
    return {
      clientId,
      reviewId: reviewData.id,
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
  // Verificar autenticação
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

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
