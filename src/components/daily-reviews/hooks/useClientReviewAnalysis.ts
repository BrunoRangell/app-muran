
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ClientWithReview, MetaAccount } from "./types/reviewTypes";
import { fetchClientsWithMetaData, fetchMetaAccounts, fetchClientReviews } from "./services/clientMetaService";
import { reviewClient as reviewClientService, reviewAllClients as reviewAllClientsService } from "./services/reviewService";

export const useClientReviewAnalysis = () => {
  const { toast } = useToast();
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [processingAccounts, setProcessingAccounts] = useState<string[]>([]);

  const processClientsWithReviews = async () => {
    const clientsData = await fetchClientsWithMetaData();
    const metaAccountsData = await fetchMetaAccounts();
    
    const processedClients: ClientWithReview[] = [];
    let lastReviewTime: Date | null = null;
    
    // Log para diagnóstico
    console.log("Processando clientes com contas Meta...");
    console.log(`Total de clientes: ${clientsData.length}`);
    console.log(`Total de contas Meta: ${metaAccountsData.length}`);
    
    for (const client of clientsData) {
      // Buscar as contas Meta associadas a este cliente
      const clientMetaAccounts = metaAccountsData.filter(account => 
        account.client_id === client.id && account.status === 'active'
      );
      
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
    
    return { 
      clientsData: processedClients, 
      lastReviewTime,
      metaAccountsData 
    };
  };
  
  const { 
    data: result,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['clients-with-reviews'],
    queryFn: processClientsWithReviews,
    refetchInterval: 300000, // 5 minutos
  });
  
  const handleReviewClient = async (clientId: string, accountId?: string) => {
    // Log para diagnóstico
    console.log(`Iniciando revisão para cliente ${clientId}${accountId ? ` e conta ${accountId}` : ''}`);
    
    // Se temos um accountId específico, marcamos a combinação cliente + conta como em processamento
    if (accountId) {
      const accountKey = `${clientId}-${accountId}`;
      setProcessingAccounts((prev) => [...prev, accountKey]);
    } else {
      // Caso contrário, marcamos apenas o cliente como em processamento
      setProcessingClients((prev) => [...prev, clientId]);
    }
    
    try {
      const result = await reviewClientService(clientId, accountId);
      
      toast({
        title: "Revisão concluída",
        description: "A revisão do orçamento foi realizada com sucesso.",
        duration: 5000,
      });
      
      console.log(`Revisão concluída para cliente ${clientId}${accountId ? ` e conta ${accountId}` : ''}:`, result);
      
      // Recarregar os dados
      await refetch();
      
    } catch (error: any) {
      console.error("Erro ao revisar cliente:", error);
      toast({
        title: "Erro ao realizar revisão",
        description: error.message || "Ocorreu um erro ao revisar o orçamento",
        variant: "destructive",
      });
    } finally {
      // Limpamos os status de processamento
      if (accountId) {
        const accountKey = `${clientId}-${accountId}`;
        setProcessingAccounts((prev) => prev.filter(key => key !== accountKey));
      } else {
        setProcessingClients((prev) => prev.filter(id => id !== clientId));
      }
    }
  };
  
  const handleReviewAllClients = async () => {
    if (!result?.clientsData || !result?.metaAccountsData) {
      toast({
        title: "Nenhum cliente para analisar",
        description: "Não há clientes disponíveis para análise.",
        variant: "default",
      });
      return;
    }
    
    const clientIds = result.clientsData.map(client => client.id);
    setProcessingClients(clientIds);
    
    // Também marque todas as contas como em processamento
    const accountKeys: string[] = [];
    result.metaAccountsData.forEach(account => {
      accountKeys.push(`${account.client_id}-${account.account_id}`);
    });
    setProcessingAccounts(accountKeys);
    
    try {
      // Modificar para passar as contas Meta também
      await reviewAllClientsService(result.clientsData, refetch, result.metaAccountsData);
      
      toast({
        title: "Análise em massa concluída",
        description: "Todos os clientes foram analisados com sucesso.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Erro ao revisar todos os clientes:", error);
      toast({
        title: "Erro na análise em massa",
        description: error.message || "Ocorreu um erro ao revisar todos os clientes",
        variant: "destructive",
      });
    } finally {
      setProcessingClients([]);
      setProcessingAccounts([]);
    }
  };
  
  const isProcessingAccount = (clientId: string, accountId?: string) => {
    // Se não temos um accountId específico, verificamos se o cliente está em processamento
    if (!accountId) {
      return processingClients.includes(clientId);
    }
    
    // Caso contrário, verificamos se a combinação cliente + conta está em processamento
    const accountKey = `${clientId}-${accountId}`;
    return processingAccounts.includes(accountKey) || processingClients.includes(clientId);
  };
  
  return { 
    filteredClients: result?.clientsData, 
    isLoading, 
    processingClients,
    lastReviewTime: result?.lastReviewTime,
    metaAccounts: result?.metaAccountsData || [],
    reviewClient: handleReviewClient,
    reviewAllClients: handleReviewAllClients,
    isProcessingAccount
  };
};
