
import { supabase } from "@/integrations/supabase/client";
import { ClientWithReview } from "../types/reviewTypes";

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

  // Primeiro, buscar todos os clientes ativos
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      status
    `)
    .eq('status', 'active')
    .order('company_name');
    
  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }
  
  // Agora, para cada cliente, buscar apenas a revisão mais recente
  let lastReviewTime: Date | null = null;
  const processedClients: ClientWithReview[] = [];
  
  for (const client of clientsData || []) {
    // Buscar apenas a revisão mais recente para este cliente
    const { data: reviewData, error: reviewError } = await supabase
      .from('budget_reviews')
      .select('*')
      .eq('client_id', client.id)
      .order('review_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (reviewError) {
      console.error(`Erro ao buscar revisão para cliente ${client.company_name}:`, reviewError);
      // Continuar com o próximo cliente
      processedClients.push({
        ...client,
        lastReview: null,
        status: client.status
      });
      continue;
    }
    
    // Buscar contas Meta para este cliente
    const { data: metaAccounts } = await supabase
      .from('client_accounts')
      .select('*')
      .eq('client_id', client.id)
      .eq('platform', 'meta')
      .eq('status', 'active');
    
    // Buscar contas Google para este cliente
    const { data: googleAccounts } = await supabase
      .from('client_accounts')
      .select('*')
      .eq('client_id', client.id)
      .eq('platform', 'google')
      .eq('status', 'active');
    
    // Adicionar a revisão mais recente ao cliente
    processedClients.push({
      ...client,
      lastReview: reviewData ? {
        ...reviewData,
        google_daily_budget_current: reviewData.daily_budget_current || 0,
        google_total_spent: reviewData.total_spent || 0,
        meta_daily_budget_current: reviewData.daily_budget_current || 0,
        meta_total_spent: reviewData.total_spent || 0,
      } : null,
      status: client.status,
      meta_accounts: metaAccounts || [],
      google_accounts: googleAccounts || [],
    });
    
    // Atualizar o timestamp da revisão mais recente global
    if (reviewData) {
      const reviewDate = new Date(reviewData.created_at);
      if (!lastReviewTime || reviewDate > lastReviewTime) {
        lastReviewTime = reviewDate;
      }
    }
  }
  
  console.log("Clientes processados com revisões:", processedClients?.length);
  
  return processedClients;
};

/**
 * Analisa um cliente específico
 */
export const analyzeClient = async (clientId: string, clientsData: ClientWithReview[]) => {
  console.log("Analisando cliente:", clientId);
  
  // Buscar dados do cliente
  const client = clientsData.find(c => c.id === clientId);
  
  if (!client) {
    console.error("Cliente não encontrado na lista:", clientId);
    
    // Tentar buscar diretamente do banco de dados
    const { data: dbClient, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) {
      throw new Error(`Cliente não encontrado: ${error.message}`);
    }
  }
  
  // Buscar contas Meta do cliente
  const { data: metaAccounts } = await supabase
    .from('client_accounts')
    .select('*')
    .eq('client_id', clientId)
    .eq('platform', 'meta')
    .eq('status', 'active');
  
  if (!metaAccounts || metaAccounts.length === 0) {
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
  
  // Usar a primeira conta Meta ativa
  const metaAccount = metaAccounts[0];
  
  // Chamar a função Edge para análise
  console.log("Chamando Meta Budget Calculator para o cliente:", clientId);
  
  const { data, error } = await supabase.functions.invoke(
    "meta-budget-calculator",
    {
      body: {
        accountId: metaAccount.account_id,
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
    console.error("Erro na função Edge:", error);
    throw new Error(`Erro na análise do orçamento: ${error.message}`);
  }
  
  console.log("Resposta da função Edge:", data);
  
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
    .from('budget_reviews')
    .select('id')
    .eq('client_id', clientId)
    .eq('account_id', metaAccount.id)
    .eq('platform', 'meta')
    .eq('review_date', today)
    .maybeSingle();
  
  // Salvar ou atualizar a revisão
  if (existingReview) {
    // Atualizar revisão existente
    await supabase
      .from('budget_reviews')
      .update({
        daily_budget_current: metaDailyBudget,
        total_spent: metaTotalSpent,
        ...customBudgetInfo,
        updated_at: now.toISOString()
      })
      .eq('id', existingReview.id);
  } else {
    // Criar nova revisão
    await supabase
      .from('budget_reviews')
      .insert({
        client_id: clientId,
        account_id: metaAccount.id,
        platform: 'meta',
        review_date: today,
        daily_budget_current: metaDailyBudget,
        total_spent: metaTotalSpent,
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
