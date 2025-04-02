
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";

// Consolidando as funções de serviços em um único hook
export const useMetaAdsAnalysis = () => {
  const [client, setClient] = useState<any>(null);
  const [analysis, setAnalysis] = useState<SimpleAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const { toast } = useToast();

  // Função para buscar o token do Meta Ads
  const fetchMetaToken = async () => {
    try {
      const { data, error } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .single();

      if (error) {
        throw new Error(`Token do Meta Ads não encontrado: ${error.message}`);
      }

      return data?.value;
    } catch (err) {
      console.error("[fetchMetaToken] Erro:", err);
      throw new Error("Não foi possível obter o token do Meta Ads");
    }
  };

  // Função para testar o token do Meta Ads
  const testMetaToken = async () => {
    try {
      setIsLoading(true);
      const token = await fetchMetaToken();
      if (!token) {
        throw new Error("Token do Meta Ads não encontrado");
      }

      toast({
        title: "Token do Meta Ads válido",
        description: "Conexão com o Meta Ads está configurada corretamente.",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Erro no token do Meta Ads",
        description: err.message || "Não foi possível validar o token do Meta Ads",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para invocar a função edge
  const invokeEdgeFunction = async (payload: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "meta-budget-calculator",
        { body: payload }
      );

      if (error) {
        return { error };
      }

      return { result };
    } catch (err: any) {
      return {
        error: {
          message: err.message || "Erro ao chamar a função Edge",
        },
      };
    }
  };

  // Função para testar a função edge
  const testEdgeFunction = async () => {
    try {
      setIsLoading(true);
      const { result, error } = await invokeEdgeFunction({ test: true });

      if (error) {
        throw new Error(`Erro ao testar função Edge: ${error.message}`);
      }

      toast({
        title: "Função Edge operacional",
        description: "A conexão com a função Edge está funcionando corretamente.",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Erro na função Edge",
        description: err.message || "Não foi possível conectar com a função Edge",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar dados do cliente
  const fetchClientData = async (clientId: string) => {
    try {
      console.log("[useMetaAdsAnalysis] Buscando dados do cliente:", clientId);
      
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id, meta_ads_budget")
        .eq("id", clientId)
        .single();
      
      if (clientError) {
        throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
      }
      
      if (!clientData) {
        throw new Error("Cliente não encontrado");
      }
      
      if (!clientData.meta_account_id) {
        throw new Error("Cliente não possui ID do Meta Ads configurado");
      }
      
      setClient(clientData);
      return clientData;
    } catch (error) {
      setClient(null);
      throw error;
    }
  };

  // Função para preparar datas
  const prepareDateRangeForCurrentMonth = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    const formattedToday = today.toISOString().split('T')[0];
    
    return {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      today: formattedToday
    };
  };

  // Função para processar resposta
  const processResponse = (result: any, token: string) => {
    try {
      setRawApiResponse({
        ...result,
        token: token.substring(0, 12) + "..." // Mostrar apenas parte do token por segurança
      });
      
      if (result.error) {
        throw new Error(`Erro na API do Meta Ads: ${JSON.stringify(result.error)}`);
      }
      
      if (!result.meta) {
        result.meta = {
          totalSpent: 0,
          dailyBudget: 0,
          campaigns: [],
          dateRange: {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        };
      }
      
      // Garantir que valores numéricos sejam números
      if (result.meta) {
        result.meta.totalSpent = typeof result.meta.totalSpent === 'string' 
          ? parseFloat(result.meta.totalSpent) || 0 
          : (result.meta.totalSpent || 0);
          
        result.meta.dailyBudget = typeof result.meta.dailyBudget === 'string' 
          ? parseFloat(result.meta.dailyBudget) || 0 
          : (result.meta.dailyBudget || 0);
      }
      
      // Normalizar as campanhas (simplificado)
      if (result.meta && result.meta.campaigns) {
        result.meta.campaigns = result.meta.campaigns.map((campaign: any) => {
          if (campaign.spend && typeof campaign.spend === 'string') {
            campaign.spend = parseFloat(campaign.spend) || 0;
          }
          return campaign;
        });
      }
      
      setAnalysis(result);
      
      toast({
        title: "Análise concluída",
        description: "Dados do Meta Ads obtidos com sucesso!",
      });
    } catch (error: any) {
      console.error("[processResponse] Erro ao processar resposta:", error.message);
      setDebugInfo(prev => ({
        ...prev,
        processingError: error.message
      }));
      
      toast({
        title: "Erro ao processar dados",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  // Função principal de análise
  const fetchAnalysis = async (clientId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("[useMetaAdsAnalysis] Iniciando análise para cliente:", clientId);
      
      const clientData = await fetchClientData(clientId);
      
      const token = await fetchMetaToken();
      if (!token) {
        throw new Error("Token do Meta Ads não encontrado ou não configurado");
      }
      
      const { startDate, endDate, today } = prepareDateRangeForCurrentMonth();
      
      try {
        console.log("[useMetaAdsAnalysis] Invocando função Edge...");
        
        const payload = {
          method: "getMetaAdsData",
          clientId,
          reviewDate: today,
          accessToken: token,
          clientName: clientData.company_name,
          metaAccountId: clientData.meta_account_id,
          dateRange: {
            start: startDate,
            end: endDate
          },
          fetchSeparateInsights: true,
          debug: true
        };
        
        const { result, error: edgeError } = await invokeEdgeFunction(payload);
        
        if (edgeError) {
          throw edgeError;
        }
        
        if (!result) {
          throw new Error("A função retornou dados vazios ou inválidos");
        }
        
        processResponse(result, token);
      } catch (edgeError: any) {
        console.error("[useMetaAdsAnalysis] Erro ao chamar função Edge:", edgeError);
        
        if (edgeError.message?.includes("Timeout") || 
            edgeError.message?.includes("Failed to send") ||
            edgeError.message?.includes("Network")) {
          
          setError(`Erro de conectividade com a função Edge: ${edgeError.message}`);
          
          setDebugInfo({
            edgeError: edgeError.message,
            suggestion: "Verifique se a função Edge está publicada e acessível."
          });
          
          toast({
            title: "Erro na função Edge",
            description: "Não foi possível conectar com a função Edge.",
            variant: "destructive",
          });
        } else {
          throw edgeError;
        }
      }
    } catch (err: any) {
      setError(err.message);
      
      toast({
        title: "Erro na análise",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    client,
    analysis,
    isLoading,
    error,
    fetchAnalysis,
    rawApiResponse,
    debugInfo,
    testMetaToken,
    testEdgeFunction
  };
};
