
import { useQuery } from "@tanstack/react-query";
import { ClientWithReview, MetaAccount } from "./types/reviewTypes";
import { processClientsWithReviews } from "./services/clientProcessingService";
import { useProcessingState } from "./services/processingStateService";
import { useReviewManagement } from "./services/reviewManagementService";

/**
 * Hook principal para análise de revisões de clientes
 */
export const useClientReviewAnalysis = () => {
  // Gerenciamento de estado de processamento de clientes e contas
  const {
    processingClients,
    markClientProcessing,
    unmarkClientProcessing,
    markAccountProcessing,
    unmarkAccountProcessing,
    markAllClientsProcessing,
    markAllAccountsProcessing,
    clearAllProcessingStates,
    isProcessingAccount
  } = useProcessingState();

  // Consulta para buscar e processar clientes com revisões
  const { 
    data: result,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['clients-with-reviews'],
    queryFn: processClientsWithReviews,
    refetchInterval: 300000, // 5 minutos
  });

  // Gerenciamento de revisões de clientes
  const { 
    reviewClient, 
    reviewAllClients 
  } = useReviewManagement(
    refetch, 
    markClientProcessing,
    unmarkClientProcessing,
    markAccountProcessing,
    unmarkAccountProcessing,
    markAllClientsProcessing,
    markAllAccountsProcessing,
    clearAllProcessingStates
  );

  // Função para revisar todos os clientes com dados do resultado da consulta
  const handleReviewAllClients = async () => {
    if (!result?.clientsData || !result?.metaAccountsData) {
      return;
    }
    
    await reviewAllClients(result.clientsData, result.metaAccountsData);
  };
  
  return { 
    filteredClients: result?.clientsData, 
    isLoading, 
    processingClients,
    lastReviewTime: result?.lastReviewTime,
    metaAccounts: result?.metaAccountsData || [],
    reviewClient,
    reviewAllClients: handleReviewAllClients,
    isProcessingAccount
  };
};
