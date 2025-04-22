
import { supabase } from "@/lib/supabase";
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
      meta_account_id,
      meta_ads_budget,
      status
    `)
    .eq('status', 'active')
    .order('company_name');
    
  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }
  
  console.log(`Encontrados ${clientsData?.length || 0} clientes ativos`);
  
  // Buscar todas as contas Meta dos clientes
  const { data: metaAccountsData, error: metaError } = await supabase
    .from('client_meta_accounts')
    .select('*')
    .eq('status', 'active');
    
  if (metaError) {
    console.error("Erro ao buscar contas Meta:", metaError);
    throw new Error(`Erro ao buscar contas Meta: ${metaError.message}`);
  }
  
  console.log(`Encontradas ${metaAccountsData?.length || 0} contas Meta ativas`);

  // Verificar contas do Sorrifácil especificamente
  const sorrifacilClient = clientsData?.find(c => c.company_name === 'Sorrifácil');
  const sorrifacilAccounts = metaAccountsData?.filter(
    acc => sorrifacilClient && acc.client_id === sorrifacilClient.id
  );
  
  if (sorrifacilClient && sorrifacilAccounts && sorrifacilAccounts.length > 0) {
    console.log(`*** DIAGNÓSTICO SORRIFÁCIL: Cliente ID ${sorrifacilClient.id} tem ${sorrifacilAccounts.length} contas Meta:`, 
      sorrifacilAccounts.map(acc => ({
        id: acc.id,
        client_id: acc.client_id,
        accountId: acc.account_id,
        name: acc.account_name,
        isPrimary: acc.is_primary,
        status: acc.status
      }))
    );
  } else if (sorrifacilClient) {
    console.log(`*** DIAGNÓSTICO SORRIFÁCIL: Cliente ID ${sorrifacilClient.id} não tem contas Meta registradas`);
  } else {
    console.log(`*** DIAGNÓSTICO SORRIFÁCIL: Cliente não encontrado na lista de clientes ativos`);
  }
  
  // Agrupar contas Meta por cliente
  const metaAccountsByClient = {};
  metaAccountsData?.forEach(account => {
    if (!metaAccountsByClient[account.client_id]) {
      metaAccountsByClient[account.client_id] = [];
    }
    metaAccountsByClient[account.client_id].push(account);
  });
  
  // Verificar contas agrupadas do Sorrifácil
  if (sorrifacilClient && metaAccountsByClient[sorrifacilClient.id]) {
    console.log(`*** DIAGNÓSTICO: Sorrifácil (${sorrifacilClient.id}) tem ${metaAccountsByClient[sorrifacilClient.id].length} contas no objeto metaAccountsByClient:`, 
      metaAccountsByClient[sorrifacilClient.id].map(acc => ({
        id: acc.id,
        nome: acc.account_name,
        status: acc.status
      }))
    );
  }
  
  // Agora, para cada cliente, buscar apenas a revisão mais recente
  let lastReviewTime: Date | null = null;
  const processedClients = [];
  
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
      console.error(`Erro ao buscar revisão para cliente ${client.company_name}:`, reviewError);
      // Continuar com o próximo cliente
      processedClients.push({
        ...client,
        lastReview: null,
        meta_accounts: metaAccountsByClient[client.id] || []
      });
      continue;
    }
    
    // Adicionar a revisão mais recente e as contas Meta ao cliente
    const clientWithReview = {
      ...client,
      lastReview: reviewData,
      meta_accounts: metaAccountsByClient[client.id] || []
    };
    
    processedClients.push(clientWithReview);
    
    // Log específico para Sorrifácil
    if (client.company_name === 'Sorrifácil') {
      console.log(`*** DIAGNÓSTICO SORRIFÁCIL PROCESSADO:`, {
        id: client.id,
        company_name: client.company_name,
        contas: clientWithReview.meta_accounts.map(a => ({
          id: a.id,
          nome: a.account_name,
          status: a.status
        })),
        totalContas: clientWithReview.meta_accounts.length
      });
    }
    
    // Atualizar o timestamp da revisão mais recente global
    if (reviewData) {
      const reviewDate = new Date(reviewData.created_at);
      if (!lastReviewTime || reviewDate > lastReviewTime) {
        lastReviewTime = reviewDate;
      }
    }
  }
  
  console.log("Clientes processados com revisões e contas Meta:", processedClients?.length);
  
  // Verificar processamento final do Sorrifácil
  const processedSorrifacil = processedClients.find(c => c.company_name === 'Sorrifácil');
  if (processedSorrifacil) {
    console.log(`*** DIAGNÓSTICO FINAL SORRIFÁCIL PROCESSADO:`, {
      id: processedSorrifacil.id,
      nome: processedSorrifacil.company_name,
      contas: Array.isArray(processedSorrifacil.meta_accounts) 
        ? processedSorrifacil.meta_accounts.map(a => ({
            id: a.id,
            conta: a.account_id,
            nome: a.account_name,
            status: a.status
          }))
        : 'meta_accounts não é um array',
      tamanho_contas: Array.isArray(processedSorrifacil.meta_accounts) 
        ? processedSorrifacil.meta_accounts.length 
        : 'N/A'
    });
  }
  
  // Verificar alguns clientes para garantir que meta_accounts esteja presente
  if (processedClients.length > 0) {
    const clientesComContasSecundarias = processedClients.filter(
      c => c.meta_accounts && c.meta_accounts.length > 0
    );
    
    console.log(`Clientes com contas secundárias: ${clientesComContasSecundarias.length}`);
    
    if (clientesComContasSecundarias.length > 0) {
      const exemplo = clientesComContasSecundarias[0];
      console.log("Exemplo de cliente com contas secundárias:", {
        id: exemplo.id,
        nome: exemplo.company_name,
        qtdContas: exemplo.meta_accounts.length,
        contas: exemplo.meta_accounts.map(a => ({
          id: a.id,
          conta: a.account_id,
          nome: a.account_name,
          status: a.status
        }))
      });
    }
  }
  
  return { 
    clientsData: processedClients as ClientWithReview[] || [],
    lastReviewTime 
  };
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
  console.log("Chamando Meta Budget Calculator para o cliente:", clientId);
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
    .from("meta_custom_budgets")
    .select("id, budget_amount, start_date, end_date")
    .eq("client_id", clientId)
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
