
import { ClientWithReview, MetaAccount } from "../types/reviewTypes";
import { fetchClientsWithMetaData, fetchMetaAccounts, fetchClientReviews, createInitialReview } from "./clientMetaService";

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
    
    // Verificar se temos revisões para essas contas
    for (const account of sorrifacilAccounts) {
      const reviewsData = await fetchClientReviews(sorrifacilClient.id, account.account_id);
      console.log(`Conta ${account.account_name} (${account.account_id}): ${reviewsData?.length || 0} revisões`);
      
      // Se não houver revisões para esta conta, criar uma revisão inicial
      if (!reviewsData || reviewsData.length === 0) {
        console.log(`Criando revisão inicial para conta ${account.account_name} (${account.account_id})`);
        const initialReview = await createInitialReview(
          sorrifacilClient.id,
          account.account_id,
          account.account_name,
          account.budget_amount
        );
        console.log("Revisão inicial criada:", initialReview);
      }
    }
  }
  
  // Processar cada cliente
  for (const client of clientsData) {
    // Buscar as contas Meta associadas a este cliente
    const clientMetaAccounts = clientMetaAccountsMap.get(client.id) || [];
    
    // Log para diagnóstico
    console.log(`Cliente ${client.company_name} (${client.id}): ${clientMetaAccounts.length} contas Meta ativas`);
    
    // IMPORTANTE: Sempre criar um processedClient para cada conta Meta ativa
    // Mesmo se o cliente não tiver revisões, precisamos criar entries para as contas Meta
    if (clientMetaAccounts.length > 0) {
      // Cliente com contas Meta específicas
      for (const account of clientMetaAccounts) {
        try {
          // Buscar revisões específicas para esta conta Meta
          let accountReviewsData = await fetchClientReviews(client.id, account.account_id);
          
          // Se não houver revisões para esta conta, criar uma revisão inicial
          if (!accountReviewsData || accountReviewsData.length === 0) {
            console.log(`Sem revisão para conta ${account.account_id}. Criando revisão inicial.`);
            await createInitialReview(
              client.id,
              account.account_id,
              account.account_name,
              account.budget_amount
            );
            
            // Buscar novamente as revisões após criar
            accountReviewsData = await fetchClientReviews(client.id, account.account_id);
          }
          
          const accountLastReview = accountReviewsData?.[0] || null;
          
          // Log para diagnóstico
          console.log(`Conta ${account.account_name} (${account.account_id}): ${accountReviewsData?.length || 0} revisões`);
          console.log(`Revisão encontrada/criada:`, accountLastReview);
          
          // Criar um cliente processado para cada conta Meta
          const processedClient: ClientWithReview = {
            ...client,
            meta_account_id: account.account_id,  // Associamos a conta Meta específica
            lastReview: accountLastReview || null,
            status: client.status
          };
          
          processedClients.push(processedClient);
          
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
  processedSorrifacil.forEach((c, i) => {
    console.log(`Sorrifácil #${i + 1} - meta_account_id: ${c.meta_account_id}, lastReview:`, c.lastReview);
  });
  
  return { 
    clientsData: processedClients, 
    lastReviewTime,
    metaAccountsData 
  };
};
