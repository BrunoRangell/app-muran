
import { useToast } from "@/hooks/use-toast";
import { ClientWithReview, MetaAccount } from "../types/reviewTypes";
import { reviewClient as reviewClientService, reviewAllClients as reviewAllClientsService } from "./reviewService";

/**
 * Serviço para gerenciar revisões de orçamentos de clientes
 */
export const useReviewManagement = (
  refetch: () => Promise<any>,
  markClientProcessing: (clientId: string) => void,
  unmarkClientProcessing: (clientId: string) => void,
  markAccountProcessing: (clientId: string, accountId: string) => void,
  unmarkAccountProcessing: (clientId: string, accountId: string) => void,
  markAllClientsProcessing: (clientIds: string[]) => void,
  markAllAccountsProcessing: (accountKeys: string[]) => void,
  clearAllProcessingStates: () => void
) => {
  const { toast } = useToast();

  /**
   * Realiza a revisão de orçamento para um cliente específico ou uma conta específica
   */
  const handleReviewClient = async (clientId: string, accountId?: string) => {
    // Log para diagnóstico
    console.log(`Iniciando revisão para cliente ${clientId}${accountId ? ` e conta ${accountId}` : ''}`);
    
    // Se temos um accountId específico, marcamos a combinação cliente + conta como em processamento
    if (accountId) {
      markAccountProcessing(clientId, accountId);
    } else {
      // Caso contrário, marcamos apenas o cliente como em processamento
      markClientProcessing(clientId);
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
        unmarkAccountProcessing(clientId, accountId);
      } else {
        unmarkClientProcessing(clientId);
      }
    }
  };

  /**
   * Realiza a revisão de orçamentos para todos os clientes
   */
  const handleReviewAllClients = async (clientsData: ClientWithReview[], metaAccountsData: MetaAccount[]) => {
    if (!clientsData || !metaAccountsData) {
      toast({
        title: "Nenhum cliente para analisar",
        description: "Não há clientes disponíveis para análise.",
        variant: "default",
      });
      return;
    }
    
    const clientIds = clientsData.map(client => client.id);
    markAllClientsProcessing(clientIds);
    
    // Também marque todas as contas como em processamento
    const accountKeys: string[] = [];
    metaAccountsData.forEach(account => {
      if (account.client_id && account.account_id) {
        accountKeys.push(`${account.client_id}-${account.account_id}`);
      }
    });
    markAllAccountsProcessing(accountKeys);
    
    try {
      // Modificar para passar as contas Meta também
      await reviewAllClientsService(clientsData, refetch, metaAccountsData);
      
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
      clearAllProcessingStates();
    }
  };

  return {
    reviewClient: handleReviewClient,
    reviewAllClients: handleReviewAllClients
  };
};
