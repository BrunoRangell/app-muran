import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { reviewClient as reviewClientService } from "./services/clientAnalysisService";
import { ClientWithReview } from "./types/reviewTypes";
import { useQuery } from "@tanstack/react-query";
import { MetaAccount } from "./types/accountTypes";

export const useClientReviewAnalysis = () => {
  const { toast } = useToast();
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  
  // Função para buscar clientes com revisões
  const fetchClientsWithReviews = async () => {
    console.log("Iniciando fetchClientsWithReviews");
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("Sessão não encontrada");
      throw new Error("Usuário não autenticado");
    }

    // Buscar todos os clientes ativos
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        company_name,
        meta_ads_budget,
        status
      `)
      .eq('status', 'active')
      .order('company_name');
      
    if (clientsError) {
      console.error("Erro ao buscar clientes:", clientsError);
      throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
    }

    // Buscar todas as contas Meta ativas
    const { data: metaAccountsData, error: metaAccountsError } = await supabase
      .from('client_meta_accounts')
      .select('*')
      .eq('status', 'active');
    
    if (metaAccountsError) {
      console.error("Erro ao buscar contas Meta:", metaAccountsError);
      throw new Error(`Erro ao buscar contas Meta: ${metaAccountsError.message}`);
    }

    console.log("Contas Meta encontradas:", metaAccountsData);

    // Processar revisões para cada cliente
    const processedClients: ClientWithReview[] = [];
    let lastReviewTime: Date | null = null;
    
    for (const client of clientsData || []) {
      // Buscar todas as revisões mais recentes para este cliente (uma por conta)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('daily_budget_reviews')
        .select('*')
        .eq('client_id', client.id)
        .eq('review_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });
        
      if (reviewsError) {
        console.error(`Erro ao buscar revisões para cliente ${client.company_name}:`, reviewsError);
        processedClients.push({
          ...client,
          lastReview: null
        });
        continue;
      }

      // Usar a revisão mais recente
      const lastReview = reviewsData?.[0];
      
      processedClients.push({
        ...client,
        lastReview: lastReview || null
      });
      
      if (lastReview) {
        const reviewDate = new Date(lastReview.created_at);
        if (!lastReviewTime || reviewDate > lastReviewTime) {
          lastReviewTime = reviewDate;
        }
      }
    }
    
    console.log("Clientes processados:", processedClients.length);
    console.log("Contas Meta encontradas:", metaAccountsData?.length);
    
    return { 
      clientsData: processedClients, 
      lastReviewTime,
      metaAccountsData: metaAccountsData as MetaAccount[] || []
    };
  };
  
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
  const metaAccounts = result?.metaAccountsData || [];

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
    
    setProcessingClients(clientIds);
    
    try {
      for (const clientId of clientIds) {
        try {
          await reviewClientService(clientId);
        } catch (error) {
          console.error(`Erro ao revisar cliente ${clientId}:`, error);
        }
      }
      
      toast({
        title: "Revisão em massa concluída",
        description: `Foram revisados ${clientIds.length} clientes.`,
        duration: 5000,
      });
      
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
    metaAccounts,
    reviewClient,
    reviewAllClients
  };
};
