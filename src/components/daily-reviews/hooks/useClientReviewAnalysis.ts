
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchClientsWithReviews } from "./services/clientService";
import { reviewClient as reviewClientService } from "./services/clientAnalysisService";
import { ClientWithReview } from "./types/reviewTypes";
import { useQuery } from "@tanstack/react-query";

export const useClientReviewAnalysis = () => {
  const { toast } = useToast();
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  
  const { 
    data: result,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['clients-with-reviews'],
    queryFn: fetchClientsWithReviews,
    refetchInterval: 300000, // 5 minutos
  });
  
  const clientsWithReviews = result?.clientsData;
  const lastReviewTime = result?.lastReviewTime;
  
  const reviewClient = async (clientId: string, accountId?: string) => {
    setProcessingClients((prev) => [...prev, clientId]);
    
    try {
      console.log(`Iniciando revisão para cliente ${clientId}${accountId ? ` com conta ${accountId}` : ''}`);
      const response = await reviewClientService(clientId, accountId);
      
      toast({
        title: "Revisão concluída",
        description: "A revisão do orçamento foi realizada com sucesso.",
        duration: 5000,
      });
      
      // Atualizar os dados após a revisão
      await refetch();
      
      return response;
    } catch (error: any) {
      console.error("Erro ao revisar cliente:", error);
      toast({
        title: "Erro ao realizar revisão",
        description: error.message || "Ocorreu um erro ao revisar o orçamento",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessingClients((prev) => prev.filter(id => id !== clientId));
    }
  };
  
  const reviewAllClients = async () => {
    const clientIds = clientsWithReviews?.map(client => client.id) || [];
    
    if (clientIds.length === 0) {
      toast({
        title: "Nenhum cliente para analisar",
        description: "Não há clientes disponíveis para análise.",
        variant: "default",
      });
      return;
    }
    
    // Marcar todos como processando
    setProcessingClients(clientIds);
    
    try {
      // Processar cada cliente individualmente
      for (const clientId of clientIds) {
        try {
          await reviewClientService(clientId);
        } catch (error) {
          console.error(`Erro ao revisar cliente ${clientId}:`, error);
          // Continuar com o próximo cliente mesmo se houver erro
        }
      }
      
      toast({
        title: "Revisão em massa concluída",
        description: `Foram revisados ${clientIds.length} clientes.`,
        duration: 5000,
      });
      
      // Atualizar os dados após a revisão em massa
      await refetch();
    } catch (error: any) {
      console.error("Erro durante revisão em massa:", error);
      toast({
        title: "Erro na revisão em massa",
        description: error.message || "Ocorreu um erro durante a revisão em massa",
        variant: "destructive",
      });
    } finally {
      setProcessingClients([]);
    }
  };
  
  return { 
    filteredClients: clientsWithReviews, 
    isLoading, 
    processingClients,
    lastReviewTime,
    reviewClient,
    reviewAllClients
  };
};
