
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
    
    for (const client of clientsData) {
      const reviewsData = await fetchClientReviews(client.id);
      const lastReview = reviewsData?.[0];
      
      processedClients.push({
        ...client,
        meta_account_id: null, // Mantemos para compatibilidade com o tipo
        lastReview: lastReview || null
      });
      
      if (lastReview) {
        const reviewDate = new Date(lastReview.created_at);
        if (!lastReviewTime || reviewDate > lastReviewTime) {
          lastReviewTime = reviewDate;
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
    // Se temos um accountId específico, marcamos a combinação cliente + conta como em processamento
    if (accountId) {
      const accountKey = `${clientId}-${accountId}`;
      setProcessingAccounts((prev) => [...prev, accountKey]);
    } else {
      // Caso contrário, marcamos apenas o cliente como em processamento
      setProcessingClients((prev) => [...prev, clientId]);
    }
    
    try {
      await reviewClientService(clientId, accountId);
      
      toast({
        title: "Revisão concluída",
        description: "A revisão do orçamento foi realizada com sucesso.",
        duration: 5000,
      });
      
      await refetch();
      
    } catch (error: any) {
      console.error("Erro ao revisar cliente:", error);
      toast({
        title: "Erro ao realizar revisão",
        description: error.message || "Ocorreu um erro ao revisar o orçamento",
        variant: "destructive",
      });
      throw error;
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
