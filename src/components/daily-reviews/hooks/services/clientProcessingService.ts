
import { ClientWithReview, MetaAccount } from "../types/reviewTypes";
import { fetchClientsWithMetaData, fetchMetaAccounts, fetchClientReviews } from "./clientMetaService";

/**
 * Serviço responsável por processar clientes e suas contas Meta
 */
export const processClientsWithReviews = async () => {
  const clientsData = await fetchClientsWithMetaData();
  const metaAccountsData = await fetchMetaAccounts();
  
  const processedClients: ClientWithReview[] = [];
  let lastReviewTime: Date | null = null;
  
  // Log para diagnóstico
  console.log("Processando clientes com contas Meta...");
  console.log(`Total de clientes: ${clientsData.length}`);
  console.log(`Total de contas Meta: ${metaAccountsData.length}`);
  
  // Agrupar contas Meta por cliente para facilitar processamento
  const clientMetaAccountsMap = new Map<string, MetaAccount[]>();
  
  metaAccountsData.forEach(account => {
    if (!account.client_id) return;
    
    const accounts = clientMetaAccountsMap.get(account.client_id) || [];
    accounts.push(account);
    clientMetaAccountsMap.set(account.client_id, accounts);
  });
  
  // Log específico para Sorrifácil
  const sorrifacilClient = clientsData.find(c => 
    c.company_name.toLowerCase().includes('sorrifacil')
  );
  
  if (sorrifacilClient) {
    const sorrifacilAccounts = clientMetaAccountsMap.get(sorrifacilClient.id) || [];
    console.log(`Cliente Sorrifácil (${sorrifacilClient.id}) tem ${sorrifacilAccounts.length} contas Meta:`);
    console.log(sorrifacilAccounts);
  }
  
  // Processar cada cliente
  for (const client of clientsData) {
    // Buscar as contas Meta associadas a este cliente
    const clientMetaAccounts = clientMetaAccountsMap.get(client.id) || [];
    
    // Log para diagnóstico
    console.log(`Cliente ${client.company_name} (${client.id}): ${clientMetaAccounts.length} contas Meta ativas`);
    
    if (clientMetaAccounts.length > 0) {
      // Cliente com contas Meta específicas
      for (const account of clientMetaAccounts) {
        try {
          // Buscar revisões específicas para esta conta Meta
          const accountReviewsData = await fetchClientReviews(client.id, account.account_id);
          const accountLastReview = accountReviewsData?.[0];
          
          // Log para diagnóstico
          console.log(`Conta ${account.account_name} (${account.account_id}): ${accountReviewsData?.length || 0} revisões`);
          
          // Criar um cliente processado para cada conta Meta
          processedClients.push({
            ...client,
            meta_account_id: account.account_id,  // Associamos a conta Meta específica
            lastReview: accountLastReview || null,
            status: client.status
          });
          
          if (accountLastReview) {
            const reviewDate = new Date(accountLastReview.created_at);
            if (!lastReviewTime || reviewDate > lastReviewTime) {
              lastReviewTime = reviewDate;
            }
          }
        } catch (error) {
          console.error(`Erro ao processar conta Meta ${account.account_id} do cliente ${client.company_name}:`, error);
          // Mesmo com erro, adicionamos o cliente com a conta Meta, sem revisão
          processedClients.push({
            ...client,
            meta_account_id: account.account_id,
            lastReview: null,
            status: client.status
          });
        }
      }
    } else {
      // Cliente sem contas Meta específicas, comportamento padrão
      try {
        const reviewsData = await fetchClientReviews(client.id);
        const lastReview = reviewsData?.[0];
        
        processedClients.push({
          ...client,
          meta_account_id: null,
          lastReview: lastReview || null,
          status: client.status
        });
        
        if (lastReview) {
          const reviewDate = new Date(lastReview.created_at);
          if (!lastReviewTime || reviewDate > lastReviewTime) {
            lastReviewTime = reviewDate;
          }
        }
      } catch (error) {
        console.error(`Erro ao buscar revisões para cliente ${client.company_name}:`, error);
        processedClients.push({
          ...client,
          meta_account_id: null,
          lastReview: null,
          status: client.status
        });
      }
    }
  }
  
  // Verificação final para Sorrifácil
  const processedSorrifacil = processedClients.filter(c => 
    c.company_name.toLowerCase().includes('sorrifacil')
  );
  
  console.log(`Clientes Sorrifácil processados: ${processedSorrifacil.length}`);
  console.log(processedSorrifacil);
  
  return { 
    clientsData: processedClients, 
    lastReviewTime,
    metaAccountsData 
  };
};
