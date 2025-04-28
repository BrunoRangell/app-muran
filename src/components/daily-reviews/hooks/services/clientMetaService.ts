
import { supabase } from "@/lib/supabase";
import { ClientWithReview, MetaAccount } from "../types/reviewTypes";

export const fetchClientsWithMetaData = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

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

  return clientsData;
};

export const fetchMetaAccounts = async () => {
  const { data: metaAccountsData, error: metaAccountsError } = await supabase
    .from('client_meta_accounts')
    .select('*')
    .eq('status', 'active');
  
  if (metaAccountsError) {
    console.error("Erro ao buscar contas Meta:", metaAccountsError);
    throw new Error(`Erro ao buscar contas Meta: ${metaAccountsError.message}`);
  }

  return metaAccountsData as MetaAccount[];
};

export const fetchClientReviews = async (clientId: string) => {
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

  return reviewsData;
};
