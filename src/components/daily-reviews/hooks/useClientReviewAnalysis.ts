
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClientAnalysis } from "./useClientAnalysis";
import { useQueryClient } from "@tanstack/react-query";
import { fetchClientsWithReviews } from "./services/clientReviewService";

export const useClientReviewAnalysis = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredClients, setFilteredClients] = useState([]);
  const [processingClients, setProcessingClients] = useState([]);
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
    
    // Recarregar a lista de clientes
    loadClients();
  });
  
  // Carregar os clientes do Supabase
  const loadClients = async () => {
    setIsLoading(true);
    try {
      const clientsWithReviews = await fetchClientsWithReviews();
      setFilteredClients(clientsWithReviews.clientsData);
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
    // Evitar análises simultâneas do mesmo cliente
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
  
  // Função para analisar todos os clientes
  const reviewAllClients = async () => {
    console.log("Iniciando análise de todos os clientes");
    
    try {
      // Obter a lista atualizada de clientes
      const clientsToProcess = filteredClients.filter(client => client.meta_account_id);
      
      if (clientsToProcess.length === 0) {
        toast({
          title: "Nenhum cliente para analisar",
          description: "Não há clientes com Meta Ads configurado.",
        });
        return;
      }
      
      // Registrar os clientes como em processamento
      const clientIds = clientsToProcess.map(client => client.id);
      setProcessingClients(prev => [...new Set([...prev, ...clientIds])]);
      
      // Iniciar análises em sequência para evitar sobrecarga
      for (const client of clientsToProcess) {
        console.log(`Iniciando análise para cliente: ${client.company_name} (${client.id})`);
        
        try {
          // Usando Promise para poder aguardar cada análise
          await new Promise((resolve, reject) => {
            analyzeMutation.mutate(client.id, {
              onSuccess: () => resolve(null),
              onError: (error) => {
                console.error(`Erro na análise do cliente ${client.company_name}:`, error);
                resolve(null); // Continuar mesmo com erro
              }
            });
          });
          
          // Aguardar um curto intervalo entre as análises
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err) {
          console.error(`Erro ao analisar cliente ${client.company_name}:`, err);
          // Continuar com o próximo cliente mesmo em caso de erro
        }
      }
      
      toast({
        title: "Análise em lote concluída",
        description: `Foram processados ${clientsToProcess.length} clientes.`,
      });
      
    } catch (error) {
      console.error("Erro ao processar análise em lote:", error);
      toast({
        title: "Erro na análise em lote",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a análise em lote",
        variant: "destructive",
      });
    } finally {
      // Recarregar a lista de clientes após o processamento
      loadClients();
    }
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
    reviewAllClients,
    isRefreshing: analyzeMutation.isPending,
    isAnalyzing: analyzeMutation.isPending,
    handleRefreshAnalysis: loadClients
  };
};
