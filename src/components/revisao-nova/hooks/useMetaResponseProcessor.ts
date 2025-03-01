
import { useState } from "react";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para processar respostas da API Meta Ads
 */
export const useMetaResponseProcessor = () => {
  const [analysis, setAnalysis] = useState<SimpleAnalysisResult | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Processa resposta bem-sucedida da API
   */
  const handleSuccessfulResponse = (result: any, token: string) => {
    // Guardar a resposta bruta para depuração com informações extra
    setRawApiResponse({
      ...result,
      token: token.substring(0, 12) + "..." // Mostrar apenas parte do token para diagnóstico
    });
    
    console.log("[useMetaResponseProcessor] Resposta completa da API Meta Ads:", result);
    
    // Se tiver erro, mostrar detalhes específicos
    if (result.error) {
      console.error("[useMetaResponseProcessor] Erro reportado na resposta:", result.error);
      
      // Tentar extrair mais informações do erro
      const errorDetails = typeof result.error === 'object' ? 
        JSON.stringify(result.error) : 
        String(result.error);
      
      throw new Error(`Erro na API do Meta Ads: ${errorDetails}`);
    }
    
    // Verificação rigorosa dos dados recebidos
    if (!result.meta) {
      console.error("[useMetaResponseProcessor] Dados recebidos inválidos ou incompletos (sem meta):", result);
      throw new Error("Os dados recebidos da API do Meta Ads estão incompletos ou em formato inválido");
    }
    
    // Garantir que meta.campaigns existe, mesmo que vazio
    if (!result.meta.campaigns) {
      result.meta.campaigns = [];
      console.warn("[useMetaResponseProcessor] Nenhuma campanha encontrada, inicializando array vazio");
    }
    
    // Configurar valores padrão para evitar erros
    if (typeof result.meta.totalSpent === 'undefined') {
      result.meta.totalSpent = 0;
      console.warn("[useMetaResponseProcessor] totalSpent não encontrado, definindo como 0");
    }
    
    if (typeof result.meta.dailyBudget === 'undefined') {
      result.meta.dailyBudget = 0;
      console.warn("[useMetaResponseProcessor] dailyBudget não encontrado, definindo como 0");
    }
    
    // Logs detalhados para verificação dos valores
    console.log("[useMetaResponseProcessor] Meta dados recebidos:");
    console.log("- Total gasto:", result.meta.totalSpent);
    console.log("- Orçamento diário:", result.meta.dailyBudget);
    console.log("- Período:", result.meta.dateRange);
    console.log("- Número de campanhas:", result.meta.campaigns.length);
    
    // Verificar cada campanha individualmente
    if (result.meta.campaigns && result.meta.campaigns.length > 0) {
      console.log("[useMetaResponseProcessor] Detalhes das campanhas:");
      result.meta.campaigns.forEach((campaign: any, index: number) => {
        console.log(`Campanha ${index + 1}: ${campaign.name}`);
        console.log(`- ID: ${campaign.id}`);
        console.log(`- Status: ${campaign.status}`);
        console.log(`- Gasto: ${campaign.spend}`);
      });
      
      // Validação do total das campanhas vs total reportado
      const totalFromCampaigns = result.meta.campaigns.reduce(
        (total: number, campaign: any) => total + parseFloat(String(campaign.spend || "0")), 
        0
      );
      
      console.log(`[useMetaResponseProcessor] Total calculado manualmente das campanhas: ${totalFromCampaigns}`);
      console.log(`[useMetaResponseProcessor] Total reportado pela API: ${result.meta.totalSpent}`);
      
      if (Math.abs(totalFromCampaigns - result.meta.totalSpent) > 0.01) {
        console.warn("[useMetaResponseProcessor] AVISO: Discrepância entre o total reportado e a soma das campanhas!");
      }
    }
    
    // Garantir que todos os valores numéricos sejam números
    if (result.meta) {
      if (typeof result.meta.totalSpent !== 'number') {
        const converted = parseFloat(String(result.meta.totalSpent || "0"));
        result.meta.totalSpent = isNaN(converted) ? 0 : converted;
        console.log("[useMetaResponseProcessor] Convertido totalSpent para número:", result.meta.totalSpent);
      }
      
      if (typeof result.meta.dailyBudget !== 'number') {
        const converted = parseFloat(String(result.meta.dailyBudget || "0"));
        result.meta.dailyBudget = isNaN(converted) ? 0 : converted;
        console.log("[useMetaResponseProcessor] Convertido dailyBudget para número:", result.meta.dailyBudget);
      }
      
      if (result.meta.campaigns) {
        result.meta.campaigns = result.meta.campaigns.map((campaign: any) => {
          const spendValue = typeof campaign.spend === 'number' 
            ? campaign.spend 
            : parseFloat(String(campaign.spend || "0"));
          
          return {
            ...campaign,
            spend: isNaN(spendValue) ? 0 : spendValue
          };
        });
      }
    }
    
    setAnalysis(result as SimpleAnalysisResult);
    
    toast({
      title: "Análise concluída",
      description: "Dados do Meta Ads obtidos com sucesso!",
    });
  };

  /**
   * Extrai e formata detalhes de erro para diagnóstico
   */
  const processErrorDetails = (err: any) => {
    console.error("[useMetaResponseProcessor] Erro na análise:", err);
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    
    // Tentativa de extrair mais informações do erro para depuração
    let errorDetails: any = {};
    if (err instanceof Error) {
      errorDetails = {
        name: err.name,
        message: err.message,
        details: err.stack
      };
    } else if (typeof err === 'object' && err !== null) {
      try {
        errorDetails = {
          ...err,
          stringified: JSON.stringify(err)
        };
      } catch (e) {
        errorDetails = { raw: String(err) };
      }
    } else {
      errorDetails = {
        raw: String(err)
      };
    }
    
    // Incluir detalhes do erro na resposta bruta
    setRawApiResponse(prev => ({
      ...prev,
      error: errorDetails
    }));
    
    setDebugInfo(prev => ({
      ...prev,
      error: errorDetails
    }));
    
    return errorMessage;
  };

  return {
    analysis,
    rawApiResponse,
    debugInfo,
    setDebugInfo,
    handleSuccessfulResponse,
    processErrorDetails
  };
};
