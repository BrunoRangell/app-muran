
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMetaTokenService } from "./useMetaTokenService";
import { useEdgeFunctionService } from "./useEdgeFunctionService";
import { useMetaClientService } from "./useMetaClientService";
import { useMetaResponseProcessor } from "./useMetaResponseProcessor";

export const useMetaAdsAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false); // Ref para controlar chamadas simultâneas
  const { toast } = useToast();

  const { fetchMetaToken, testMetaToken } = useMetaTokenService();
  const { invokeEdgeFunction, testEdgeFunction } = useEdgeFunctionService();
  const { client, fetchClientData, prepareDateRangeForCurrentMonth } = useMetaClientService();
  const { 
    analysis, 
    rawApiResponse, 
    debugInfo, 
    setDebugInfo,
    handleSuccessfulResponse, 
    processErrorDetails,
    setAnalysis
  } = useMetaResponseProcessor();

  // Resetar o estado quando o componente é desmontado
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setError(null);
      setAnalysis(null);
      isFetchingRef.current = false;
    };
  }, [setAnalysis]);

  // Função para lidar com erro na função Edge
  const handleEdgeFunctionError = useCallback((edgeError: any) => {
    console.error("[useMetaAdsAnalysis] Erro ao chamar função Edge:", edgeError);
    
    if (edgeError.message?.includes("Timeout") || 
        edgeError.message?.includes("Failed to send") ||
        edgeError.message?.includes("Network")) {
      
      setError(`Erro de conectividade com a função Edge: ${edgeError.message}. Verifique se a função Edge está publicada e acessível.`);
      
      setDebugInfo({
        edgeError: edgeError.message,
        suggestion: "Verifique se a função Edge 'daily-budget-reviews' está publicada e acessível no Supabase.",
        alternativeSolution: "Use o botão 'Testar Função Edge' para diagnosticar o problema."
      });
      
      toast({
        title: "Erro na função Edge",
        description: "Não foi possível conectar com a função Edge. Use as ferramentas de diagnóstico para identificar o problema.",
        variant: "destructive",
      });
    } else {
      throw edgeError;
    }
  }, [setDebugInfo, toast]);

  // Função para preparar o payload da chamada
  const prepareEdgeFunctionPayload = useCallback((clientData: any, token: string, dateRange: any) => {
    return {
      method: "getMetaAdsData",
      clientId: clientData.id,
      reviewDate: dateRange.today,
      accessToken: token,
      clientName: clientData.company_name,
      metaAccountId: clientData.meta_account_id,
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate
      },
      fetchSeparateInsights: true, // Sinaliza para a função edge buscar insights separadamente
      debug: true
    };
  }, []);

  const fetchAnalysis = useCallback(async (clientId: string) => {
    // Evitar múltiplas chamadas simultâneas
    if (isFetchingRef.current) {
      console.log("[useMetaAdsAnalysis] Chamada ignorada, já existe uma em andamento");
      return;
    }

    setIsLoading(true);
    setError(null);
    isFetchingRef.current = true;

    try {
      console.log("[useMetaAdsAnalysis] Iniciando análise para cliente:", clientId);
      
      const clientData = await fetchClientData(clientId);
      
      const token = await fetchMetaToken();
      if (!token) {
        throw new Error("Token do Meta Ads não encontrado ou não configurado");
      }
      
      const dateRange = prepareDateRangeForCurrentMonth();
      
      try {
        console.log("[useMetaAdsAnalysis] Tentando invocar função Edge...");
        
        const payload = prepareEdgeFunctionPayload(clientData, token, dateRange);
        
        const { result, error: edgeError } = await invokeEdgeFunction(payload);
        
        if (edgeError) {
          throw edgeError;
        }
        
        if (!result) {
          throw new Error("A função retornou dados vazios ou inválidos");
        }
        
        handleSuccessfulResponse(result, token);
      } catch (edgeError: any) {
        handleEdgeFunctionError(edgeError);
      }
      
    } catch (err) {
      // Obter os detalhes do erro
      const errorData = processErrorDetails(err);
      // Usar apenas a mensagem de erro para o estado e o toast
      setError(errorData.message);
      
      toast({
        title: "Erro na análise",
        description: errorData.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    fetchClientData, 
    fetchMetaToken, 
    prepareDateRangeForCurrentMonth, 
    prepareEdgeFunctionPayload,
    invokeEdgeFunction, 
    handleSuccessfulResponse, 
    handleEdgeFunctionError, 
    processErrorDetails, 
    toast
  ]);

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
