
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
    // Verificar autenticação antes de fazer a requisição
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error("Sessão não encontrada");
      throw new Error("Usuário não autenticado");
    }

    // Primeiro, buscar todos os clientes ativos
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select(`
        id,
        company_name,
        meta_account_id,
        meta_ads_budget,
        status
      `)
      .eq('status', 'active')
      .order('company_name');
      
    if (error) {
      console.error("Erro ao buscar clientes:", error);
      throw new Error(`Erro ao buscar clientes: ${error.message}`);
    }
    
    // Agora, para cada cliente, buscar apenas a revisão mais recente
    let lastReviewTime: Date | null = null;
    const processedClients: ClientWithReview[] = [];
    
    for (const client of clientsData || []) {
      // Buscar apenas a revisão mais recente para este cliente
      const { data: reviewData, error: reviewError } = await supabase
        .from('daily_budget_reviews')
        .select('*')
        .eq('client_id', client.id)
        .order('review_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (reviewError) {
        console.error(`Erro ao buscar revisão para cliente ${client.company_name}:`, reviewError);
        // Continuar com o próximo cliente
        processedClients.push({
          ...client,
          lastReview: null
        });
        continue;
      }
      
      // Adicionar a revisão mais recente ao cliente
      processedClients.push({
        ...client,
        lastReview: reviewData
      });
      
      // Atualizar o timestamp da revisão mais recente global
      if (reviewData) {
        const reviewDate = new Date(reviewData.created_at);
        if (!lastReviewTime || reviewDate > lastReviewTime) {
          lastReviewTime = reviewDate;
        }
      }
    }
    
    console.log("Clientes processados com revisões:", processedClients?.length);
    
    // Buscar todas as contas Meta associadas
    const { data: metaAccountsData, error: metaAccountsError } = await supabase
      .from('client_meta_accounts')
      .select('*')
      .eq('status', 'active');
    
    if (metaAccountsError) {
      console.error("Erro ao buscar contas Meta:", metaAccountsError);
      // Continuar com os clientes, mas sem as contas Meta
    } else {
      console.log("Contas Meta encontradas:", metaAccountsData?.length);
    }
    
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
    metaAccounts,
    reviewClient,
    reviewAllClients
  };
};
