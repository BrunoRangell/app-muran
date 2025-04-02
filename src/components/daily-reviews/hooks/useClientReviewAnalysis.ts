
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClientAnalysis } from "./useClientAnalysis";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { fetchClientsWithReviews } from "./services/clientReviewService";

export const useClientReviewAnalysis = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredClients, setFilteredClients] = useState([]);
  const [processingClients, setProcessingClients] = useState([]);
  const [lastAnalysisTimestamp, setLastAnalysisTimestamp] = useState<number>(0);
  const queryClient = useQueryClient();

  // Importamos o hook useClientAnalysis para analisar o cliente
  const { analyzeMutation } = useClientAnalysis((data) => {
    toast({
      title: "Análise concluída",
      description: `Análise do cliente atualizada com sucesso.`,
    });
    
    // Remover o cliente da lista de processamento
    setProcessingClients(prev => prev.filter(id => id !== data.clientId));
    
    // Invalidar consultas para forçar atualização
    queryClient.invalidateQueries({ queryKey: ["client-detail", data.clientId] });
    queryClient.invalidateQueries({ queryKey: ["latest-review", data.clientId] });
    queryClient.invalidateQueries({ queryKey: ["review-history", data.clientId] });
    
    // Registrar timestamp da análise
    setLastAnalysisTimestamp(Date.now());
    
    // Recarregar a lista de clientes
    loadClients();
  });
  
  // Carregar os clientes do Supabase
  const loadClients = async () => {
    setIsLoading(true);
    try {
      const clientsWithReviews = await fetchClientsWithReviews();
      setFilteredClients(clientsWithReviews);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para analisar um cliente
  const reviewClient = (clientId) => {
    // Evitar análises muito frequentes (não mais de uma vez por minuto)
    const now = Date.now();
    
    if (processingClients.includes(clientId)) {
      toast({
        title: "Análise em andamento",
        description: "Este cliente já está sendo analisado.",
      });
      return;
    }
    
    // Adicionar o cliente à lista de processamento
    setProcessingClients(prev => [...prev, clientId]);
    console.log(`Iniciando análise para cliente: ${clientId}`);
    
    // Iniciar análise
    analyzeMutation.mutate(clientId, {
      onError: (error) => {
        console.error("Erro na análise do cliente:", error);
        setProcessingClients(prev => prev.filter(id => id !== clientId));
        
        toast({
          title: "Erro na análise",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    });
  };
  
  // Carregar clientes ao montar o componente
  useEffect(() => {
    loadClients();
  }, []);
  
  return {
    filteredClients,
    isLoading,
    processingClients,
    reviewClient,
    isRefreshing: analyzeMutation.isPending,
    isAnalyzing: analyzeMutation.isPending,
    handleRefreshAnalysis: loadClients
  };
};
