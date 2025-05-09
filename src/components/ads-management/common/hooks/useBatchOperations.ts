
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PlatformType } from "../types";

interface BatchOperationsProps {
  platform: PlatformType;
  onComplete?: () => void;
}

export function useBatchOperations({ platform, onComplete }: BatchOperationsProps) {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [processingAccounts, setProcessingAccounts] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Função para revisar um cliente específico
  const reviewClient = useCallback(async (clientId: string, accountId?: string) => {
    try {
      // Verificar se o cliente já está sendo processado
      if (processingIds.includes(clientId)) {
        console.log(`Cliente ${clientId} já está sendo processado. Ignorando solicitação.`);
        return;
      }
      
      // Se temos um ID de conta, criar uma chave composta cliente+conta
      const accountKey = accountId ? `${clientId}-${accountId}` : null;
      
      // Verificar se a conta específica já está sendo processada
      if (accountKey && processingAccounts[accountKey]) {
        console.log(`Conta ${accountId} do cliente ${clientId} já está sendo processada. Ignorando solicitação.`);
        return;
      }

      // Marcar o cliente/conta como processando
      if (accountKey) {
        setProcessingAccounts(prev => ({ ...prev, [accountKey]: true }));
      } else {
        setProcessingIds(prev => [...prev, clientId]);
      }
      
      // Preparar os endpoints e payloads de acordo com a plataforma
      const reviewData = {
        client_id: clientId,
      };
      
      if (accountId) {
        reviewData[`${platform}_account_id`] = accountId;
      }

      let reviewUrl;
      if (platform === "meta") {
        reviewUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-meta-review`;
      } else {
        reviewUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-google-review`;
      }

      // Obter token de autenticação
      const { data: authData } = await supabase.auth.getSession();
      if (!authData?.session?.access_token) {
        throw new Error("Não foi possível autenticar. Faça login novamente.");
      }

      // Fazer a requisição para a edge function
      const response = await fetch(reviewUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authData.session.access_token}`
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Ocorreu um erro durante a revisão do cliente");
      }

      // Mostrar toast de sucesso com o resultado
      toast({
        title: "Revisão concluída",
        description: `Cliente ${clientId} foi revisado com sucesso`,
      });

      // Remover marcação de processamento
      if (accountKey) {
        setProcessingAccounts(prev => {
          const newState = { ...prev };
          delete newState[accountKey];
          return newState;
        });
      } else {
        setProcessingIds(prev => prev.filter(id => id !== clientId));
      }

      return result;

    } catch (error: any) {
      console.error(`Erro ao revisar cliente ${clientId}:`, error);
      setLastError(error);
      
      // Remover marcação de processamento
      const accountKey = accountId ? `${clientId}-${accountId}` : null;
      if (accountKey) {
        setProcessingAccounts(prev => {
          const newState = { ...prev };
          delete newState[accountKey];
          return newState;
        });
      } else {
        setProcessingIds(prev => prev.filter(id => id !== clientId));
      }
      
      toast({
        title: "Erro ao revisar cliente",
        description: error.message || "Ocorreu um erro desconhecido",
        variant: "destructive",
      });

      throw error;
    }
  }, [processingIds, processingAccounts, platform, toast]);

  // Função para revisar todos os clientes
  const reviewAllClients = useCallback(async (clients: any[] = []) => {
    if (!clients || clients.length === 0) {
      toast({
        title: "Nenhum cliente para revisar",
        description: "Não há clientes disponíveis para revisão",
        variant: "default",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setLastError(null);
      
      // Iniciar a revisão em lote através da função Edge
      const { data: authData } = await supabase.auth.getSession();
      if (!authData?.session?.access_token) {
        throw new Error("Não foi possível autenticar. Faça login novamente.");
      }
      
      // Mapear IDs de clientes
      const clientIds = clients.map(client => client.id);
      setProcessingIds(clientIds);
      
      // Determinar a URL da função Edge de acordo com a plataforma
      let batchReviewUrl;
      if (platform === "meta") {
        batchReviewUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-meta-review`;
      } else {
        batchReviewUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-google-review`;
      }

      // Fazer a requisição para a função Edge de processamento em lote
      const response = await fetch(batchReviewUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authData.session.access_token}`
        },
        body: JSON.stringify({ clientIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Ocorreu um erro durante a revisão em lote");
      }
      
      toast({
        title: "Revisão em lote iniciada",
        description: `A revisão de ${clientIds.length} clientes foi iniciada com sucesso`,
      });
      
      // Se houver callback de conclusão, chamá-lo
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 2000); // Pequeno delay para dar tempo dos dados atualizarem
      }
      
      return result;
      
    } catch (error: any) {
      console.error("Erro ao revisar todos os clientes:", error);
      setLastError(error);
      
      toast({
        title: "Erro na revisão em lote",
        description: error.message || "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      // Limpar ids de processamento e finalizar estado
      setProcessingIds([]);
      setIsProcessing(false);
    }
  }, [platform, toast, onComplete]);

  // Helper para verificar se uma conta específica está sendo processada
  const isProcessingAccount = useCallback((clientId: string, accountId?: string) => {
    if (!accountId) return false;
    return Boolean(processingAccounts[`${clientId}-${accountId}`]);
  }, [processingAccounts]);

  return {
    reviewClient,
    reviewAllClients,
    processingIds,
    isProcessing,
    lastError,
    isProcessingAccount
  };
}
