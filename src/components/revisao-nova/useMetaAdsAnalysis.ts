import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMetaTokenService } from "./hooks/useMetaTokenService";
import { useEdgeFunctionService } from "./hooks/useEdgeFunctionService";
import { useMetaClientService } from "./hooks/useMetaClientService";
import { useMetaResponseProcessor } from "./hooks/useMetaResponseProcessor";

export const useMetaAdsAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    processErrorDetails 
  } = useMetaResponseProcessor();

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
        console.log("[useMetaAdsAnalysis] Tentando invocar função Edge...");
        
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
          debug: true
        };
        
        const { result, error: edgeError } = await invokeEdgeFunction(payload);
        
        if (edgeError) {
          throw edgeError;
        }
        
        if (!result) {
          throw new Error("A função retornou dados vazios ou inválidos");
        }
        
        handleSuccessfulResponse(result, token);
      } catch (edgeError: any) {
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
        } else if (edgeError.message?.includes("Corpo da requisição vazio")) {
          setError(`Erro no formato da requisição: ${edgeError.message}. O corpo da requisição não está sendo recebido pela função Edge.`);
          
          setDebugInfo({
            edgeError: edgeError.message,
            requestType: "JSON stringified payload",
            suggestion: "Verifique se o payload está sendo corretamente serializado e enviado com content-type: application/json"
          });
          
          toast({
            title: "Erro no formato da requisição",
            description: "O corpo da requisição está vazio. Verifique a ferramenta de diagnóstico para mais detalhes.",
            variant: "destructive",
          });
        } else {
          throw edgeError;
        }
      }
      
    } catch (err) {
      const errorMessage = processErrorDetails(err);
      setError(errorMessage);
      
      toast({
        title: "Erro na análise",
        description: errorMessage,
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
