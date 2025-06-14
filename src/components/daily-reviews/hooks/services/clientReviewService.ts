
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "../types/reviewTypes";
import { logger } from "@/utils/logger";

/**
 * Busca todos os clientes com suas respectivas revisões mais recentes
 */
export const fetchClientsWithReviews = async () => {
  logger.info("CLIENT_REVIEW", "Iniciando fetchClientsWithReviews");
  
  // Verificar autenticação antes de fazer a requisição
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    logger.error("AUTH", "Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

  // Primeiro, buscar todos os clientes ativos
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      meta_account_id,
      meta_ads_budget,
      status
    `)
    .eq('status', 'active')
    .order('company_name');
    
  if (error) {
    logger.error("CLIENT_REVIEW", "Erro ao buscar clientes", error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }
  
  // Agora, para cada cliente, buscar apenas a revisão mais recente
  let lastReviewTime: Date | null = null;
  const processedClients: ClientWithReview[] = [];
  
  for (const client of clientsData || []) {
    // Buscar apenas a revisão mais recente para este cliente
    const { data: reviewData, error: reviewError } = await supabase
      .from('daily_budget_reviews')
      .select('*')
      .eq('client_id', client.id)
      .order('review_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (reviewError) {
      logger.error("CLIENT_REVIEW", `Erro ao buscar revisão para cliente ${client.company_name}`, reviewError);
      // Continuar com o próximo cliente
      processedClients.push({
        ...client,
        lastReview: null,
        status: client.status as "active" | "inactive"
      });
      continue;
    }
    
    // Adicionar a revisão mais recente ao cliente
    processedClients.push({
      ...client,
      lastReview: reviewData,
      status: client.status as "active" | "inactive"
    });
    
    // Atualizar o timestamp da revisão mais recente global
    if (reviewData) {
      const reviewDate = new Date(reviewData.created_at);
      if (!lastReviewTime || reviewDate > lastReviewTime) {
        lastReviewTime = reviewDate;
      }
    }
  }
  
  logger.info("CLIENT_REVIEW", "Clientes processados com revisões", { count: processedClients?.length });
  
  return processedClients;
};

/**
 * Analisa um cliente específico
 */
export const analyzeClient = async (clientId: string, clientsData: ClientWithReview[]) => {
  logger.info("CLIENT_REVIEW", "Analisando cliente", { clientId });
  
  // Buscar dados do cliente
  const client = clientsData.find(c => c.id === clientId);
  
  if (!client) {
    logger.error("CLIENT_REVIEW", "Cliente não encontrado na lista", { clientId });
    
    // Tentar buscar diretamente do banco de dados
    const { data: dbClient, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) {
      throw new Error(`Cliente não encontrado: ${error.message}`);
    }
    
    if (!dbClient.meta_account_id) {
      throw new Error("Cliente não possui configuração de Meta Ads");
    }
  } else if (!client.meta_account_id) {
    throw new Error("Cliente não possui configuração de Meta Ads");
  }
  
  // Buscar token do Meta Ads
  const { data: tokenData, error: tokenError } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'meta_access_token')
    .single();
  
  if (tokenError || !tokenData?.value) {
    throw new Error("Token do Meta Ads não encontrado");
  }
  
  // Preparar datas para análise
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const formattedStartDate = startDate.toISOString().split('T')[0];
  
  // Chamar a função Edge para análise
  logger.info("CLIENT_REVIEW", "Chamando Meta Budget Calculator para o cliente", { clientId });
  const metaAccountId = client?.meta_account_id || (
    await supabase.from('clients').select('meta_account_id').eq('id', clientId).single()
  ).data?.meta_account_id;
  
  if (!metaAccountId) {
    throw new Error("ID da conta Meta não encontrado para o cliente");
  }
  
  const { data, error } = await supabase.functions.invoke(
    "meta-budget-calculator",
    {
      body: {
        accountId: metaAccountId,
        accessToken: tokenData.value,
        dateRange: {
          start: formattedStartDate,
          end: today
        },
        fetchSeparateInsights: true
      },
    }
  );
  
  if (error) {
    logger.error("CLIENT_REVIEW", "Erro na função Edge", error);
    throw new Error(`Erro na análise do orçamento: ${error.message}`);
  }
  
  logger.info("CLIENT_REVIEW", "Resposta da função Edge", data);
  
  if (!data) {
    throw new Error("A resposta da API não contém dados");
  }
  
  // Extrair valores da resposta
  const metaDailyBudget = data.totalDailyBudget || 0;
  const metaTotalSpent = data.totalSpent || 0;
  
  // Buscar orçamento personalizado
  const { data: customBudgetData } = await supabase
    .from("custom_budgets")
    .select("id, budget_amount, start_date, end_date")
    .eq("client_id", clientId)
    .eq("platform", "meta")
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();
  
  // Preparar informações do orçamento personalizado
  const customBudgetInfo = customBudgetData
    ? {
        using_custom_budget: true,
        custom_budget_id: customBudgetData.id,
        custom_budget_amount: customBudgetData.budget_amount,
      }
    : {
        using_custom_budget: false,
        custom_budget_id: null,
        custom_budget_amount: null,
      };
  
  // Verificar se já existe revisão para hoje
  const { data: existingReview } = await supabase
    .from('daily_budget_reviews')
    .select('id')
    .eq('client_id', clientId)
    .eq('review_date', today)
    .maybeSingle();
  
  // Salvar ou atualizar a revisão
  if (existingReview) {
    // Atualizar revisão existente
    await supabase
      .from('daily_budget_reviews')
      .update({
        meta_daily_budget_current: metaDailyBudget,
        meta_total_spent: metaTotalSpent,
        ...customBudgetInfo,
        updated_at: now.toISOString()
      })
      .eq('id', existingReview.id);
  } else {
    // Criar nova revisão
    await supabase
      .from('daily_budget_reviews')
      .insert({
        client_id: clientId,
        review_date: today,
        meta_daily_budget_current: metaDailyBudget,
        meta_total_spent: metaTotalSpent,
        meta_account_id: metaAccountId,
        meta_account_name: `Conta ${metaAccountId}`,
        ...customBudgetInfo
      });
  }
  
  return {
    success: true,
    clientId,
    metaDailyBudget,
    metaTotalSpent,
    customBudgetInfo
  };
};
