
import { useState, useEffect, useCallback } from 'react';
import { ClientWithReview } from './types/reviewTypes';
import { fetchClientsWithReviews } from './services/clientReviewService';
import { analyzeClient } from './services/clientReviewService';
import { useToast } from '@/hooks/use-toast';

export const useClientReviewAnalysis = () => {
  const [clients, setClients] = useState<ClientWithReview[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Carregar clientes
  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const { clientsData, lastReviewTime } = await fetchClientsWithReviews();
      console.log("Clientes carregados:", clientsData.length);
      
      // Filtrar apenas clientes com contas Meta configuradas
      const clientsWithMeta = clientsData.filter(client => 
        client.meta_account_id || (client.meta_accounts && client.meta_accounts.length > 0)
      );
      
      setClients(clientsWithMeta);
      setFilteredClients(clientsWithMeta);
      
      if (lastReviewTime) {
        setLastAnalysisTime(new Date(lastReviewTime));
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar clientes quando o componente montar
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Função para analisar um cliente específico
  const reviewClient = useCallback(async (clientId: string) => {
    try {
      setProcessingClients(prev => [...prev, clientId]);
      
      const result = await analyzeClient(clientId, clients);
      
      if (result.success) {
        toast({
          title: "Análise concluída",
          description: "O orçamento do cliente foi analisado com sucesso.",
        });
        
        // Recarregar os clientes para obter os dados atualizados
        await loadClients();
      }
    } catch (error) {
      console.error("Erro ao analisar cliente:", error);
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [clients, loadClients, toast]);

  // Função para analisar todos os clientes
  const reviewAllClients = useCallback(async () => {
    try {
      setIsAnalyzingAll(true);
      
      // Verificar se há clientes para analisar
      if (clients.length === 0) {
        toast({
          title: "Nenhum cliente para analisar",
          description: "Não há clientes com Meta Ads configurados.",
          variant: "destructive",
        });
        return;
      }
      
      // Cria uma lista de IDs dos clientes que têm contas Meta
      const clientIds = clients
        .filter(client => client.meta_account_id || (client.meta_accounts && client.meta_accounts.length > 0))
        .map(client => client.id);
      
      // Analisa cada cliente sequencialmente
      let successCount = 0;
      let errorCount = 0;
      
      for (const clientId of clientIds) {
        try {
          setProcessingClients(prev => [...prev, clientId]);
          await analyzeClient(clientId, clients);
          successCount++;
        } catch (error) {
          console.error(`Erro ao analisar cliente ${clientId}:`, error);
          errorCount++;
        } finally {
          setProcessingClients(prev => prev.filter(id => id !== clientId));
        }
      }
      
      // Recarregar clientes
      await loadClients();
      
      // Exibir resultado
      toast({
        title: `Análise concluída: ${successCount} cliente(s)`,
        description: errorCount > 0 ? `Ocorreram erros em ${errorCount} cliente(s)` : "Todos os clientes foram analisados com sucesso.",
        variant: errorCount > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Erro na análise em lote:", error);
      toast({
        title: "Erro na análise em lote",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingAll(false);
    }
  }, [clients, loadClients, toast]);

  return {
    clients,
    filteredClients,
    isLoading,
    isAnalyzingAll,
    processingClients,
    lastAnalysisTime,
    reviewClient,
    reviewAllClients,
    loadClients
  };
};
