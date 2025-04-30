
import { supabase } from "@/lib/supabase";
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
      meta_ads_budget,
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
    .from('client_meta_accounts')
    .select('*')
    .eq('status', 'active');
  
  if (metaAccountsError) {
    console.error("Erro ao buscar contas Meta:", metaAccountsError);
    throw new Error(`Erro ao buscar contas Meta: ${metaAccountsError.message}`);
  }

  console.log(`Encontradas ${metaAccountsData.length} contas Meta ativas`);
  
  // Log detalhado para verificar contas da Sorrifácil
  const sorrifacilAccounts = metaAccountsData.filter(account => {
    return account.client_id && (
      (account.account_name && account.account_name.toLowerCase().includes('sorrifacil')) || 
      (account.account_id && account.account_id.toLowerCase().includes('sorrifacil'))
    );
  });
  
  console.log(`Contas Meta da Sorrifácil encontradas: ${sorrifacilAccounts.length}`);
  if (sorrifacilAccounts.length > 0) {
    console.log("Detalhes das contas Meta da Sorrifácil:", sorrifacilAccounts);
  }

  return metaAccountsData as MetaAccount[];
};

export const fetchClientReviews = async (clientId: string, accountId?: string) => {
  if (accountId) {
    console.log(`Buscando revisões para cliente ${clientId} e conta Meta ${accountId}...`);
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('daily_budget_reviews')
      .select('*')
      .eq('client_id', clientId)
      .eq('meta_account_id', accountId)
      .eq('review_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });
      
    if (reviewsError) {
      console.error(`Erro ao buscar revisões para cliente ${clientId} e conta ${accountId}:`, reviewsError);
      return null;
    }

    console.log(`Encontradas ${reviewsData?.length || 0} revisões para o cliente ${clientId} e conta ${accountId}`);
    return reviewsData;
  } else {
    console.log(`Buscando revisões para cliente ${clientId}...`);
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('daily_budget_reviews')
      .select('*')
      .eq('client_id', clientId)
      .eq('review_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });
      
    if (reviewsError) {
      console.error(`Erro ao buscar revisões para cliente ${clientId}:`, reviewsError);
      return null;
    }

    console.log(`Encontradas ${reviewsData?.length || 0} revisões para o cliente ${clientId}`);
    return reviewsData;
  }
};
