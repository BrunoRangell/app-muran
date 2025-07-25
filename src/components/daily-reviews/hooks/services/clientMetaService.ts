
import { supabase } from "@/integrations/supabase/client";
import { ClientWithReview, MetaAccount } from "../types/reviewTypes";

export const fetchClientsWithMetaData = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

  console.log("Buscando clientes ativos...");
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      status
    `)
    .eq('status', 'active')
    .order('company_name');
    
  if (clientsError) {
    console.error("Erro ao buscar clientes:", clientsError);
    throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
  }

  console.log(`Encontrados ${clientsData.length} clientes ativos`);
  return clientsData;
};

export const fetchMetaAccounts = async () => {
  console.log("Buscando contas Meta ativas...");
  const { data: metaAccountsData, error: metaAccountsError } = await supabase
    .from('client_accounts')
    .select('*')
    .eq('status', 'active')
    .eq('platform', 'meta');
  
  if (metaAccountsError) {
    console.error("Erro ao buscar contas Meta:", metaAccountsError);
    throw new Error(`Erro ao buscar contas Meta: ${metaAccountsError.message}`);
  }

  console.log(`Encontradas ${metaAccountsData.length} contas Meta ativas`);
  
  // Verificar e imprimir detalhes de todas as contas Meta para diagnóstico
  metaAccountsData.forEach(account => {
    console.log(`Conta Meta: ${account.account_name || 'Sem nome'} (${account.account_id}) - Cliente: ${account.client_id}, Budget: ${account.budget_amount}`);
  });
  
  // Log detalhado para verificar contas da Sorrifácil
  const sorrifacilAccounts = metaAccountsData.filter(account => {
    return account.client_id && (
      (account.account_name && account.account_name.toLowerCase().includes('sorrifacil')) || 
      (account.client_id && metaAccountsData.some(a => 
        a.client_id === account.client_id && 
        (a.account_name && a.account_name.toLowerCase().includes('sorrifacil'))
      ))
    );
  });
  
  // Também buscar por nome da empresa para garantir
  const { data: sorrifacilClient } = await supabase
    .from('clients')
    .select('id, company_name')
    .ilike('company_name', '%sorrifacil%')
    .maybeSingle();
  
  if (sorrifacilClient) {
    const sorrifacilAccounts2 = metaAccountsData.filter(account => 
      account.client_id === sorrifacilClient.id
    );
    
    console.log(`Cliente Sorrifácil encontrado via nome: ${sorrifacilClient.id}`);
    console.log(`Contas Meta do cliente Sorrifácil (via nome): ${sorrifacilAccounts2.length}`);
    console.log("Detalhes das contas Meta Sorrifácil (via nome):", sorrifacilAccounts2);
  }
  
  console.log(`Contas Meta da Sorrifácil encontradas: ${sorrifacilAccounts.length}`);
  if (sorrifacilAccounts.length > 0) {
    console.log("Detalhes das contas Meta da Sorrifácil:", sorrifacilAccounts);
  }

  return metaAccountsData as MetaAccount[];
};

export const fetchClientReviews = async (clientId: string, accountId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    if (accountId) {
      console.log(`Buscando revisões para cliente ${clientId} e conta Meta ${accountId}...`);
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('budget_reviews')
        .select('*')
        .eq('client_id', clientId)
        .eq('account_id', accountId)
        .eq('platform', 'meta')
        .eq('review_date', today)
        .order('created_at', { ascending: false });
        
      if (reviewsError) {
        console.error(`Erro ao buscar revisões para cliente ${clientId} e conta ${accountId}:`, reviewsError);
        return null;
      }

      console.log(`Encontradas ${reviewsData?.length || 0} revisões para o cliente ${clientId} e conta ${accountId}`);
      
      // Se não encontrou revisões, registrar para diagnóstico
      if (!reviewsData || reviewsData.length === 0) {
        console.log(`*** ALERTA: Sem revisões para conta ${accountId} do cliente ${clientId}. Mostrando card sem dados de revisão.`);
      }
      
      return reviewsData;
    } else {
      console.log(`Buscando revisões para cliente ${clientId}...`);
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('budget_reviews')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', 'meta')
        .eq('review_date', today)
        .order('created_at', { ascending: false });
        
      if (reviewsError) {
        console.error(`Erro ao buscar revisões para cliente ${clientId}:`, reviewsError);
        return null;
      }

      console.log(`Encontradas ${reviewsData?.length || 0} revisões para o cliente ${clientId}`);
      return reviewsData;
    }
  } catch (error) {
    console.error(`Erro ao buscar revisões: ${error}`);
    return null;
  }
};

// Nova função para criar uma revisão inicial para uma conta sem revisões
export const createInitialReview = async (clientId: string, accountId: string, accountName?: string, budgetAmount?: number) => {
  try {
    console.log(`Criando revisão inicial para conta ${accountId} do cliente ${clientId}`);
    
    // Buscar detalhes da conta Meta
    let metaAccountName = accountName;
    let metaBudgetAmount = budgetAmount;
    
    if (!metaAccountName || metaBudgetAmount === undefined) {
      const { data: metaAccount } = await supabase
        .from('client_accounts')
        .select('account_name, budget_amount')
        .eq('client_id', clientId)
        .eq('account_id', accountId)
        .eq('platform', 'meta')
        .maybeSingle();
      
      if (metaAccount) {
        metaAccountName = metaAccount.account_name;
        metaBudgetAmount = metaAccount.budget_amount;
      }
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já existe uma revisão para evitar duplicação
    const { data: existingReview } = await supabase
      .from('budget_reviews')
      .select('id')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .eq('platform', 'meta')
      .eq('review_date', today)
      .maybeSingle();
      
    if (existingReview) {
      console.log(`Revisão já existe para conta ${accountId}, ID: ${existingReview.id}`);
      return existingReview;
    }
    
    // Criar uma revisão inicial com valores zerados
    const { data: review, error } = await supabase
      .from('budget_reviews')
      .insert({
        client_id: clientId,
        account_id: accountId,
        platform: 'meta',
        review_date: today,
        daily_budget_current: 0,
        total_spent: 0,
        using_custom_budget: false
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao criar revisão inicial para conta ${accountId}:`, error);
      return null;
    }
    
    console.log(`Revisão inicial criada com sucesso para conta ${accountId}:`, review);
    return review;
  } catch (error) {
    console.error(`Erro ao criar revisão inicial:`, error);
    return null;
  }
};
