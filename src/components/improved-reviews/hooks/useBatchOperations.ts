
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface BatchOperationsProps {
  platform: 'meta' | 'google';
  onComplete?: () => void;
}

export function useBatchOperations({ platform, onComplete }: BatchOperationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { toast } = useToast();

  const reviewClient = async (clientId: string, accountId?: string) => {
    try {
      setProcessingIds((prev) => [...prev, clientId]);

      // Determinar qual função Edge chamar com base na plataforma
      const functionName = platform === 'meta' ? 'daily-meta-review' : 'daily-google-review';

      console.log(`Iniciando revisão de ${platform} para cliente ${clientId}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          clientId,
          ...(platform === 'google' && accountId ? { googleAccountId: accountId } : {}),
        },
      });

      if (error) {
        console.error(`Erro na revisão de ${platform}:`, error);
        throw new Error(`Erro ao analisar cliente: ${error.message}`);
      }

      console.log(`Revisão de ${platform} concluída:`, data);

      if (!data.success) {
        throw new Error(data.error || `Erro na revisão de ${platform}`);
      }

      toast({
        title: 'Revisão concluída',
        description: `A análise de ${platform} foi concluída com sucesso`,
      });

      return data;
    } catch (err: any) {
      const errorMessage = err.message || `Falha na revisão de ${platform}`;
      console.error(errorMessage, err);
      
      toast({
        variant: 'destructive',
        title: 'Erro na revisão',
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== clientId));
    }
  };

  const reviewAllClients = async (clients: any[] = []) => {
    try {
      setIsProcessing(true);
      
      // Filtrar apenas clientes que possuem contas da plataforma selecionada
      const clientsToReview = clients.filter((client) => {
        if (platform === 'meta') {
          return client.meta_account_id;
        } else {
          return client.google_account_id || (client.google_accounts && client.google_accounts.length > 0);
        }
      });
      
      if (clientsToReview.length === 0) {
        toast({
          title: 'Nenhum cliente para revisar',
          description: `Não há clientes com contas de ${platform === 'meta' ? 'Meta Ads' : 'Google Ads'} para analisar`,
        });
        return;
      }
      
      // Iniciar revisão sequencial para evitar sobrecarga
      let completedCount = 0;
      let errorCount = 0;

      console.log(`Iniciando revisão em lote de ${clientsToReview.length} clientes`);
      
      const results = [];
      
      for (const client of clientsToReview) {
        try {
          setProcessingIds((prev) => [...prev, client.id]);
          
          // Determinar ID de conta apropriado com base na plataforma
          const accountId = platform === 'meta' 
            ? client.meta_account_id
            : client.google_account_id || (client.google_accounts?.[0]?.account_id);
          
          // Chamar a função Edge correspondente
          const { data, error } = await supabase.functions.invoke(
            platform === 'meta' ? 'daily-meta-review' : 'daily-google-review', 
            {
              body: { 
                clientId: client.id,
                ...(platform === 'google' && accountId ? { googleAccountId: accountId } : {})
              },
            }
          );
          
          if (error) {
            throw new Error(error.message);
          }
          
          if (!data.success) {
            throw new Error(data.error || 'Erro desconhecido');
          }
          
          completedCount++;
          results.push(data);
        } catch (err: any) {
          console.error(`Erro ao revisar ${client.company_name}:`, err);
          errorCount++;
        } finally {
          setProcessingIds((prev) => prev.filter(id => id !== client.id));
        }
      }

      // Relatar resultados
      console.log(`Revisão em lote concluída. Sucesso: ${completedCount}, Falhas: ${errorCount}`);
      
      if (errorCount === 0) {
        toast({
          title: 'Revisão em lote concluída',
          description: `Todos os ${completedCount} clientes foram analisados com sucesso`,
        });
      } else {
        toast({
          variant: 'default',
          title: 'Revisão em lote concluída',
          description: `${completedCount} clientes analisados com sucesso, ${errorCount} falhas`,
        });
      }
      
      // Chamar callback de conclusão se fornecido
      if (onComplete) {
        onComplete();
      }
      
      return results;
    } catch (err: any) {
      console.error('Erro na revisão em lote:', err);
      toast({
        variant: 'destructive',
        title: 'Erro na revisão em lote',
        description: err.message || 'Ocorreu um erro durante a análise em lote',
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    reviewClient,
    reviewAllClients,
    isReviewingBatch: isProcessing,
    processingIds,
  };
}
