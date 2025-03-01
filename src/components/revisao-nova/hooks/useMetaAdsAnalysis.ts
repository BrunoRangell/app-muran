
import { useState } from "react";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useToast } from "@/hooks/use-toast";
import { useMetaTokenService } from "./useMetaTokenService";
import { useEdgeFunctionService } from "./useEdgeFunctionService";
import { useMetaClientService } from "./useMetaClientService";
import { useMetaResponseProcessor } from "./useMetaResponseProcessor";

export const useMetaAdsAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Hooks separados para cada responsabilidade
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
      
      // 1. Buscar dados do cliente
      const clientData = await fetchClientData(clientId);
      
      // 2. Buscar token do Meta Ads
      const token = await fetchMetaToken();
      if (!token) {
        throw new Error("Token do Meta Ads não encontrado ou não configurado");
      }
      
      // 3. Preparar datas para período
      const { startDate, endDate, today } = prepareDateRangeForCurrentMonth();
      
      // 4. Invocar a função Edge
      try {
        console.log("[useMetaAdsAnalysis] Tentando invocar função Edge...");
        
        // Payload com dados completos
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
          debug: true // Solicitar informações extras de debug
        };
        
        const { result, error: edgeError } = await invokeEdgeFunction(payload);
        
        if (edgeError) {
          throw edgeError;
        }
        
        if (!result) {
          throw new Error("A função retornou dados vazios ou inválidos");
        }
        
        // Processar resultado da função Edge
        handleSuccessfulResponse(result, token);
      } catch (edgeError: any) {
        console.error("[useMetaAdsAnalysis] Erro ao chamar função Edge:", edgeError);
        
        // Verificar se devemos tentar método alternativo
        if (edgeError.message?.includes("Timeout") || 
            edgeError.message?.includes("Failed to send") ||
            edgeError.message?.includes("Network")) {
          
          // Temos um erro de conectividade, vamos tentar uma abordagem alternativa
          // Informar o usuário sobre o problema e recomendar verificar a função Edge
          setError(`Erro de conectividade com a função Edge: ${edgeError.message}. Verifique se a função Edge está publicada e acessível.`);
          
          // Adicionar informações de diagnóstico
          setDebugInfo({
            edgeError: edgeError.message,
            suggestion: "Verifique se a função Edge 'daily-budget-reviews' está publicada e acessível no Supabase.",
            alternativeSolution: "Use o botão 'Testar Função Edge' para diagnosticar o problema."
          });
          
          // Mostrar toast com informação sobre o erro
          toast({
            title: "Erro na função Edge",
            description: "Não foi possível conectar com a função Edge. Use as ferramentas de diagnóstico para identificar o problema.",
            variant: "destructive",
          });
        } else {
          // Outro tipo de erro, repassar
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
