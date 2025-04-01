
// Atualizando o hook useBatchReview para suportar a atualização automática após análises
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ClientWithReview } from './types/reviewTypes';
import { useClientAnalysis } from './useClientAnalysis';

export const useBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Usar o hook useClientAnalysis para analisar clientes
  const { analyzeMutation } = useClientAnalysis((data) => {
    // Remover cliente da lista de processamento
    setProcessingClients(prev => prev.filter(id => id !== data.clientId));
    
    // Incrementar progresso quando estiver em análise em lote
    if (isBatchAnalyzing) {
      setBatchProgress(prev => prev + 1);
    }
    
    // Atualizar o cache com os novos dados
    queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
  });

  // Consulta para obter clientes com revisões
  const { data: clientsWithReviews, isLoading, error } = useQuery({
    queryKey: ['clients-with-reviews'],
    queryFn: async () => {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*, daily_budget_reviews(*)')
        .eq('status', 'active')
        .order('company_name');

      if (clientsError) throw clientsError;

      // Se não houver clientes, retornar array vazio
      if (!clients || clients.length === 0) {
        return [];
      }

      // Buscar orçamentos personalizados ativos
      const today = new Date().toISOString().split('T')[0];
      const { data: customBudgets, error: budgetsError } = await supabase
        .from('meta_custom_budgets')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .eq('is_active', true);

      if (budgetsError) {
        console.error('Erro ao buscar orçamentos personalizados:', budgetsError);
      }

      // Mapear orçamentos personalizados para os clientes
      const clientsWithCustomBudgets = clients.map(client => {
        // Buscar o orçamento personalizado mais recente para este cliente
        const customBudget = customBudgets?.find(
          budget => budget.client_id === client.id
        );

        // Buscar a revisão mais recente
        const latestReview = client.daily_budget_reviews
          ?.sort((a: any, b: any) => {
            // Ordenar por data de revisão (mais recente primeiro)
            return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
          })
          .at(0);

        return {
          ...client,
          daily_budget_reviews: client.daily_budget_reviews,
          latestReview: latestReview || null,
          customBudget: customBudget || null
        };
      });

      return clientsWithCustomBudgets as ClientWithReview[];
    }
  });

  // Mutação para revisar todos os clientes
  const batchReviewMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-meta-review', {
        body: { manual: true }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Atualizar a hora da última revisão em lote
      setLastBatchReviewTime(new Date());
      
      // Atualizar a lista de clientes com revisões após um pequeno atraso
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
      }, 3000);
      
      // Indicar que o processo de análise em lote foi concluído
      setIsBatchAnalyzing(false);
      setBatchProgress(totalClientsToAnalyze);
      
      toast({
        title: 'Análise em lote concluída',
        description: `Todos os ${totalClientsToAnalyze} clientes foram analisados.`
      });
    },
    onError: (error) => {
      console.error('Erro na revisão em lote:', error);
      setIsBatchAnalyzing(false);
      
      toast({
        title: 'Erro na análise em lote',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao analisar os clientes',
        variant: 'destructive',
      });
    }
  });

  // Buscar a hora da última revisão em lote ao iniciar
  useEffect(() => {
    const fetchLastBatchReviewTime = async () => {
      try {
        const { data, error } = await supabase
          .from('system_configs')
          .select('value')
          .eq('key', 'last_batch_review_time')
          .single();

        if (!error && data?.value) {
          setLastBatchReviewTime(new Date(data.value));
        }
      } catch (err) {
        console.error('Erro ao buscar hora da última revisão em lote:', err);
      }
    };

    fetchLastBatchReviewTime();
  }, []);

  // Função para revisar um único cliente
  const reviewSingleClient = useCallback(async (clientId: string) => {
    setProcessingClients(prev => [...prev, clientId]);
    
    try {
      await analyzeMutation.mutateAsync(clientId);
      return true;
    } catch (err) {
      console.error(`Erro ao analisar cliente ${clientId}:`, err);
      
      // Remover cliente da lista de processamento em caso de erro
      setProcessingClients(prev => prev.filter(id => id !== clientId));
      return false;
    }
  }, [analyzeMutation]);

  // Função para revisar todos os clientes
  const reviewAllClients = useCallback(async () => {
    // Verificar se existem clientes com Meta Ads configurado
    const clientsWithMeta = clientsWithReviews?.filter(client => 
      client.meta_account_id && client.meta_account_id.trim() !== ''
    ) || [];
    
    if (clientsWithMeta.length === 0) {
      toast({
        title: 'Nenhum cliente para analisar',
        description: 'Não existem clientes com Meta Ads configurado.',
        variant: 'destructive',
      });
      return;
    }
    
    // Configurar estado para análise em lote
    setIsBatchAnalyzing(true);
    setBatchProgress(0);
    setTotalClientsToAnalyze(clientsWithMeta.length);
    
    try {
      // Executar a função de revisão em lote
      await batchReviewMutation.mutateAsync();
      
    } catch (err) {
      console.error('Erro ao iniciar análise em lote:', err);
      setIsBatchAnalyzing(false);
      
      toast({
        title: 'Erro ao iniciar análise em lote',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao iniciar a análise em lote',
        variant: 'destructive',
      });
    }
  }, [clientsWithReviews, batchReviewMutation, toast]);

  return {
    clientsWithReviews,
    isLoading,
    error,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    isBatchAnalyzing,
    lastBatchReviewTime,
    batchProgress,
    totalClientsToAnalyze,
  };
};
