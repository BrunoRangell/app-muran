
import { useState } from "react";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useToast } from "@/hooks/use-toast";
import { normalizeCampaigns } from "./processors/campaignProcessor";
import { validateAnalysisResult } from "./processors/responseValidator";
import { processErrorDetails } from "./processors/errorProcessor";

/**
 * Hook para processar e validar respostas da API Meta Ads
 */
export const useMetaResponseProcessor = () => {
  const [analysis, setAnalysis] = useState<SimpleAnalysisResult | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Processa respostas bem-sucedidas da API
   */
  const handleSuccessfulResponse = (result: any, token: string) => {
    try {
      // Guardar a resposta bruta para depuração com informações extra
      setRawApiResponse({
        ...result,
        token: token.substring(0, 12) + "..." // Mostrar apenas parte do token por segurança
      });
      
      console.log("[useMetaResponseProcessor] Resposta completa da API Meta Ads:", result);
      
      // Verificar se há erro explícito na resposta
      if (result.error) {
        console.error("[useMetaResponseProcessor] Erro reportado na resposta:", result.error);
        throw new Error(`Erro na API do Meta Ads: ${JSON.stringify(result.error)}`);
      }
      
      // Normalizar as campanhas para garantir formato de gastos adequado
      if (result.meta && result.meta.campaigns) {
        result.meta.campaigns = normalizeCampaigns(result.meta.campaigns);
      }
      
      // Validar e sanitizar o resultado
      const validatedResult = validateAnalysisResult(result);
      
      // Atualizar o estado com o resultado validado
      setAnalysis(validatedResult);
      
      toast({
        title: "Análise concluída",
        description: "Dados do Meta Ads obtidos com sucesso!",
      });
    } catch (error) {
      // Caso haja erros no processamento, capturar e reportar
      const errorDetails = processErrorDetails(error);
      
      console.error("[useMetaResponseProcessor] Erro ao processar resposta:", errorDetails.message);
      setDebugInfo(prev => ({
        ...prev,
        processingError: errorDetails.details
      }));
      
      toast({
        title: "Erro ao processar dados",
        description: errorDetails.message,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return {
    analysis,
    rawApiResponse,
    debugInfo,
    setDebugInfo,
    handleSuccessfulResponse,
    processErrorDetails,
    setAnalysis
  };
};
