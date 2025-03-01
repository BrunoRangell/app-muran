import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMetaTokenService } from "./useMetaTokenService";
import { useEdgeFunctionService } from "./useEdgeFunctionService";
import { useMetaClientService } from "./useMetaClientService";
import { useMetaResponseProcessor } from "./useMetaResponseProcessor";
import { DateTime } from "luxon";

export const useMetaAdsAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { fetchMetaToken, testMetaToken } = useMetaTokenService();
  const { invokeEdgeFunction, testEdgeFunction } = useEdgeFunctionService();
  const { client, fetchClientData } = useMetaClientService();
  const { 
    analysis, 
    rawApiResponse, 
    debugInfo, 
    setDebugInfo,
    handleSuccessfulResponse, 
    processErrorDetails 
  } = useMetaResponseProcessor();

  // Função para calcular o período do mês atual
  const prepareCurrentMonthRange = () => {
    const today = DateTime.now().setZone("America/Sao_Paulo");
    return {
      startDate: today.startOf("month").toISODate(), // Ex: "2025-03-01"
      endDate: today.endOf("month").toISODate(),     // Ex: "2025-03-31"
      today: today.toISODate()
    };
  };

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
      
      // Usar período dinâmico do mês atual
      const { startDate, endDate, today } = prepareCurrentMonthRange();
      console.log("[DEBUG] Período do mês atual:", { startDate, endDate });

      try {        
        const payload = {
          method: "getMetaAdsData",
          clientId,
          reviewDate: today,
          accessToken: token,
          clientName: clientData.company_name,
          metaAccountId: clientData.meta_account_id,
          fields: "status,name,spend,insights{spend}", 
          dateRange: { start: startDate, end: endDate },
          time_range: JSON.stringify({ since: startDate, until: endDate }), // Formato correto
          debug: true
        };
        
        const { result, error: edgeError } = await invokeEdgeFunction(payload);
        console.log("[DEBUG] Resposta Bruta da API:", JSON.stringify(result, null, 2));
        
        if (edgeError) throw edgeError;
        if (!result?.data) throw new Error("Dados da API ausentes ou mal formatados");
        
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
        } else {
          throw edgeError;
        }
      }
      
    } catch (err) {
      const errorData = processErrorDetails(err);
      setError(errorData.message);
      
      toast({
        title: "Erro na análise",
        description: errorData.message,
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
