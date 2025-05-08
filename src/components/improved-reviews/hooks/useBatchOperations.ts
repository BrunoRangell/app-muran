
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { findActiveCustomBudget, prepareCustomBudgetInfo } from "./useCustomBudgetFinder";

interface BatchOperationsProps {
  platform: "meta" | "google";
  onComplete?: () => void;
}

export function useBatchOperations({ platform, onComplete }: BatchOperationsProps) {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [processingAccounts, setProcessingAccounts] = useState<{clientId: string, accountId: string}[]>([]);
  const { toast } = useToast();

  // Função para verificar se uma conta específica está sendo processada
  const isProcessingAccount = (clientId: string, accountId?: string) => {
    if (!accountId) return false;
    return processingAccounts.some(item => 
      item.clientId === clientId && item.accountId === accountId
    );
  };

  // Função para revisar um cliente específico
  const reviewClient = async (clientId: string, accountId?: string | null) => {
    try {
      console.log(`Iniciando revisão para cliente ${clientId} (${platform})`);
      
      // Adicionar à lista de IDs em processamento
      setProcessingIds(prev => [...prev, clientId]);
      if (accountId) {
        setProcessingAccounts(prev => [...prev, {clientId, accountId}]);
      }

      // Buscar orçamento personalizado ativo se existir
      const customBudget = accountId ? 
        await findActiveCustomBudget(clientId, accountId, platform) : 
        await findActiveCustomBudget(clientId, undefined, platform);
      
      // Preparar informações do orçamento personalizado
      const customBudgetInfo = prepareCustomBudgetInfo(customBudget);
      
      // Construir payload para a função de revisão
      const payload = {
        client_id: clientId,
        account_id: accountId || undefined,
        ...customBudgetInfo
      };
      
      console.log(`Payload para revisão:`, payload);
      
      // Chamar função Edge
      const { error } = await supabase.functions.invoke(
        platform === "meta" ? "daily-meta-review" : "daily-google-review", 
        {
          body: payload
        }
      );

      if (error) {
        throw new Error(`Erro ao revisar o cliente: ${error.message}`);
      }

      console.log(`Revisão concluída para cliente ${clientId}`);
      
      // Chamar callback de conclusão se fornecido
      if (onComplete) onComplete();

      return true;
    } catch (error: any) {
      console.error(`Erro ao revisar cliente ${clientId}:`, error);
      toast({
        title: "Erro na revisão",
        description: error.message || "Ocorreu um erro ao revisar o cliente",
        variant: "destructive"
      });
      throw error;
    } finally {
      // Remover da lista de IDs em processamento
      setProcessingIds(prev => prev.filter(id => id !== clientId));
      if (accountId) {
        setProcessingAccounts(prev => 
          prev.filter(item => !(item.clientId === clientId && item.accountId === accountId))
        );
      }
    }
  };

  // Função para revisar todos os clientes
  const reviewAllClients = async (clients: any[]) => {
    try {
      console.log(`Iniciando revisão em lote para ${clients.length} clientes (${platform})`);
      
      // Adicionar todos os IDs de clientes à lista de processamento
      const clientIds = clients.map(client => client.id);
      setProcessingIds(prev => [...prev, ...clientIds]);

      // Processar cada cliente
      for (const client of clients) {
        const accountId = client[`${platform}_account_id`];
        if (accountId) {
          setProcessingAccounts(prev => [...prev, {clientId: client.id, accountId}]);
        }
        
        // Buscar orçamento personalizado ativo se existir
        const customBudget = accountId ? 
          await findActiveCustomBudget(client.id, accountId, platform) : 
          await findActiveCustomBudget(client.id, undefined, platform);
        
        // Preparar informações do orçamento personalizado
        const customBudgetInfo = prepareCustomBudgetInfo(customBudget);
        
        // Construir payload para a função de revisão
        const payload = {
          client_id: client.id,
          account_id: accountId || undefined,
          ...customBudgetInfo
        };
        
        // Chamar função Edge
        await supabase.functions.invoke(
          platform === "meta" ? "daily-meta-review" : "daily-google-review", 
          {
            body: payload
          }
        );
        
        // Remover conta específica da lista de processamento
        if (accountId) {
          setProcessingAccounts(prev => 
            prev.filter(item => !(item.clientId === client.id && item.accountId === accountId))
          );
        }
      }

      console.log(`Revisão em lote concluída para ${clients.length} clientes`);
      
      // Chamar callback de conclusão se fornecido
      if (onComplete) onComplete();

      return true;
    } catch (error: any) {
      console.error(`Erro na revisão em lote:`, error);
      toast({
        title: "Erro na revisão em lote",
        description: error.message || "Ocorreu um erro ao revisar os clientes",
        variant: "destructive"
      });
      throw error;
    } finally {
      // Limpar lista de IDs em processamento
      setProcessingIds([]);
      setProcessingAccounts([]);
    }
  };

  return {
    processingIds,
    isProcessing: processingIds.length > 0,
    isProcessingAccount,
    reviewClient,
    reviewAllClients
  };
}
