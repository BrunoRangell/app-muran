
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useReviewsContext } from '@/contexts/ReviewsContext';

interface ReviewOperationsOptions {
  onComplete?: () => void;
  platform: 'meta' | 'google';
}

interface ReviewClientParams {
  clientId: string;
  accountId?: string;
}

export function useReviewOperations({ 
  onComplete, 
  platform 
}: ReviewOperationsOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    markClientProcessing,
    unmarkClientProcessing,
    markAccountProcessing,
    unmarkAccountProcessing,
    clearProcessingStates,
    setBatchProcessing
  } = useReviewsContext();
  
  const reviewClient = useCallback(async ({ clientId, accountId }: ReviewClientParams) => {
    setLastError(null);
    
    // Definir o ID da conta específico para chaves de processamento
    const accountKey = accountId ? `${clientId}-${accountId}` : clientId;
    
    // Marcar cliente/conta como em processamento
    if (accountId) {
      markAccountProcessing(accountKey);
    } else {
      markClientProcessing(clientId);
    }
    
    try {
      // Determinar a URL da função Edge com base na plataforma
      const endpoint = platform === 'meta' 
        ? `${window.location.origin}/api/daily-meta-review` 
        : `${window.location.origin}/api/daily-google-review`;
      
      // Criar payload para a requisição
      const payload = {
        clientId,
        ...(accountId && { metaAccountId: accountId }),
        reviewDate: new Date().toISOString().split('T')[0]
      };
      
      console.log(`Revisando cliente ${clientId}${accountId ? ` (conta ${accountId})` : ''}`);
      
      // Fazer a chamada para a função Edge
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || errorData?.message || `Erro ao processar revisão: ${response.status}`
        );
      }
      
      const result = await response.json();
      
      // Invalidar queries para atualizar os dados
      const queryKey = platform === 'meta' 
        ? ['improved-meta-reviews'] 
        : ['improved-google-reviews'];
        
      await queryClient.invalidateQueries({ queryKey });
      
      // Notificar sucesso
      toast({
        title: 'Revisão concluída',
        description: `A revisão do cliente foi concluída com sucesso.`
      });
      
      return result;
    } catch (error) {
      console.error(`Erro ao revisar ${platform}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setLastError(error instanceof Error ? error : new Error(errorMessage));
      
      toast({
        title: 'Erro na revisão',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw error;
    } finally {
      // Desmarcar cliente/conta como em processamento
      if (accountId) {
        unmarkAccountProcessing(accountKey);
      } else {
        unmarkClientProcessing(clientId);
      }
    }
  }, [
    platform, 
    markClientProcessing, 
    unmarkClientProcessing, 
    markAccountProcessing, 
    unmarkAccountProcessing, 
    queryClient, 
    toast
  ]);

  const reviewAllClients = useCallback(async (clients: any[]) => {
    setIsProcessing(true);
    setBatchProcessing(true);
    setLastError(null);
    
    const failedClients: string[] = [];
    const successfulClients: string[] = [];
    
    try {
      // Marcar todos os clientes como em processamento
      clients.forEach(client => markClientProcessing(client.id));
      
      // Processar clientes sequencialmente para evitar sobrecarga
      for (const client of clients) {
        try {
          await reviewClient({ 
            clientId: client.id,
            accountId: client.meta_account_id || client.account_id
          });
          successfulClients.push(client.company_name || client.id);
        } catch (error) {
          failedClients.push(client.company_name || client.id);
        }
      }
      
      // Atualizar queries relacionadas
      const queryKey = platform === 'meta' 
        ? ['improved-meta-reviews'] 
        : ['improved-google-reviews'];
        
      await queryClient.invalidateQueries({ queryKey });
      
      toast({
        title: 'Revisão em lote concluída',
        description: `${successfulClients.length} revisões concluídas com sucesso${
          failedClients.length > 0 ? `, ${failedClients.length} falhas` : ''
        }.`
      });
      
      // Chamar callback de conclusão
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setLastError(error instanceof Error ? error : new Error(errorMessage));
      
      toast({
        title: 'Erro na revisão em lote',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setBatchProcessing(false);
      clearProcessingStates();
    }
  }, [
    reviewClient, 
    markClientProcessing, 
    clearProcessingStates, 
    setBatchProcessing, 
    queryClient, 
    platform, 
    toast, 
    onComplete
  ]);

  return {
    reviewClient,
    reviewAllClients,
    isProcessing,
    lastError
  };
}
