
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ClientWithReview, GoogleReview } from "./types/reviewTypes";
import { callEdgeFunction } from "./useEdgeFunction";

export const useClientDetails = (clientId: string) => {
  const [client, setClient] = useState<ClientWithReview | null>(null);
  const [reviewHistory, setReviewHistory] = useState<GoogleReview[] | null>(null);
  const [latestReview, setLatestReview] = useState<GoogleReview | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Carregar dados do cliente
  useEffect(() => {
    const fetchClient = async () => {
      setIsLoadingClient(true);
      setError(null);
      
      try {
        // Buscar cliente
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            *,
            google_accounts(*),
            google_reviews:client_google_reviews(*)
          `)
          .eq('id', clientId)
          .single();
          
        if (clientError) throw new Error(clientError.message);
        
        if (!clientData) {
          setClient(null);
          return;
        }
        
        // Buscar última revisão
        const { data: lastReviewData, error: reviewError } = await supabase
          .from('client_google_reviews')
          .select('*')
          .eq('client_id', clientId)
          .order('review_date', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (reviewError) throw new Error(reviewError.message);
        
        // Mapear para o formato esperado
        const clientWithReview: ClientWithReview = {
          ...clientData,
          lastReview: lastReviewData
        };
        
        setClient(clientWithReview);
        if (lastReviewData) setLatestReview(lastReviewData);
      } catch (err) {
        console.error('Erro ao carregar cliente:', err);
        setError(err instanceof Error ? err : new Error('Erro ao carregar cliente'));
        toast({
          title: "Erro ao carregar cliente",
          description: err instanceof Error ? err.message : 'Ocorreu um erro desconhecido',
          variant: "destructive",
        });
      } finally {
        setIsLoadingClient(false);
      }
    };
    
    const fetchReviewHistory = async () => {
      setIsLoadingHistory(true);
      
      try {
        const { data, error: historyError } = await supabase
          .from('client_google_reviews')
          .select('*')
          .eq('client_id', clientId)
          .order('review_date', { ascending: false })
          .limit(20);
          
        if (historyError) throw new Error(historyError.message);
        
        setReviewHistory(data);
      } catch (err) {
        console.error('Erro ao carregar histórico de revisões:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    if (clientId) {
      fetchClient();
      fetchReviewHistory();
    }
  }, [clientId, toast]);

  // Função para revisar o cliente
  const reviewClient = async () => {
    if (!clientId) return;
    
    setIsReviewing(true);
    setError(null);
    
    try {
      // Corrigido: passando apenas um argumento (clientId) em vez de dois
      const result = await callEdgeFunction("daily-google-review", { clientId });
      
      if (!result || !result.success) {
        // Corrigido: acessando message ao invés de error
        throw new Error(result?.message || 'Falha ao revisar o cliente');
      }
      
      toast({
        title: "Revisão concluída",
        description: "A revisão do cliente foi concluída com sucesso.",
      });
      
      // Recarregar dados
      setIsLoadingClient(true);
      setIsLoadingHistory(true);
      
      // Buscar cliente atualizado
      const { data: clientData } = await supabase
        .from('clients')
        .select(`
          *,
          google_accounts(*),
          google_reviews:client_google_reviews(*)
        `)
        .eq('id', clientId)
        .single();
        
      // Buscar última revisão
      const { data: lastReviewData } = await supabase
        .from('client_google_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      // Buscar histórico atualizado
      const { data: historyData } = await supabase
        .from('client_google_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false })
        .limit(20);
        
      // Atualizar o estado
      if (clientData) {
        setClient({
          ...clientData,
          lastReview: lastReviewData
        });
      }
      
      if (lastReviewData) setLatestReview(lastReviewData);
      if (historyData) setReviewHistory(historyData);
    } catch (err) {
      console.error('Erro ao revisar o cliente:', err);
      setError(err instanceof Error ? err : new Error('Erro ao revisar o cliente'));
      toast({
        title: "Erro na revisão",
        description: err instanceof Error ? err.message : 'Ocorreu um erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setIsReviewing(false);
      setIsLoadingClient(false);
      setIsLoadingHistory(false);
    }
  };

  // Função para atualizar os dados
  const refreshClient = async () => {
    setIsLoadingClient(true);
    setIsLoadingHistory(true);
    setError(null);
    
    try {
      // Buscar cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          google_accounts(*),
          google_reviews:client_google_reviews(*)
        `)
        .eq('id', clientId)
        .single();
        
      if (clientError) throw new Error(clientError.message);
      
      // Buscar última revisão
      const { data: lastReviewData, error: reviewError } = await supabase
        .from('client_google_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (reviewError) throw new Error(reviewError.message);
      
      // Buscar histórico
      const { data: historyData, error: historyError } = await supabase
        .from('client_google_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false })
        .limit(20);
        
      if (historyError) throw new Error(historyError.message);
      
      // Atualizar o estado
      if (clientData) {
        setClient({
          ...clientData,
          lastReview: lastReviewData
        });
      }
      
      if (lastReviewData) setLatestReview(lastReviewData);
      if (historyData) setReviewHistory(historyData);
      
      toast({
        title: "Dados atualizados",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
      setError(err instanceof Error ? err : new Error('Erro ao atualizar dados'));
      toast({
        title: "Erro ao atualizar dados",
        description: err instanceof Error ? err.message : 'Ocorreu um erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setIsLoadingClient(false);
      setIsLoadingHistory(false);
    }
  };

  return {
    client,
    reviewHistory,
    latestReview,
    isLoadingClient,
    isLoadingHistory,
    isReviewing,
    error,
    reviewClient,
    refreshClient
  };
};
