
import { useState } from "react";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useToast } from "@/hooks/use-toast";

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
    
    // Verificar cada campanha individualmente e garantir que o valor de spend é numérico
    if (result.meta.campaigns && result.meta.campaigns.length > 0) {
      result.meta.campaigns = result.meta.campaigns.map((campaign: any) => {
        // Garantir que o gasto da campanha (spend) é um número
        const spend = typeof campaign.spend === 'number' 
          ? campaign.spend 
          : parseFloat(String(campaign.spend || "0"));
          
        console.log(`Campanha: ${campaign.name}, ID: ${campaign.id}, Status: ${campaign.status}, Gasto: ${spend}`);
        
        return {
          ...campaign,
          spend: isNaN(spend) ? 0 : spend
        };
      });
      
      // Calcular o total das campanhas para logs de depuração
      const totalFromCampaigns = result.meta.campaigns.reduce(
        (total: number, campaign: any) => {
          const campaignSpend = typeof campaign.spend === 'number' 
            ? campaign.spend 
            : parseFloat(String(campaign.spend || "0"));
          return total + (isNaN(campaignSpend) ? 0 : campaignSpend);
        }, 
        0
      );
      
      console.log(`[useMetaResponseProcessor] Total calculado manualmente das campanhas: ${totalFromCampaigns}`);
      console.log(`[useMetaResponseProcessor] Total reportado pela API: ${result.meta.totalSpent}`);
      
      // Se o total reportado for 0 ou muito pequeno, mas temos gastos nas campanhas,
      // use o total calculado das campanhas como o total geral
      if (Math.abs(result.meta.totalSpent) < 0.01 && totalFromCampaigns > 0) {
        console.log("[useMetaResponseProcessor] Atualizando total reportado para o total das campanhas");
        result.meta.totalSpent = totalFromCampaigns;
      }
    }
    
    // Garantir que todos os valores numéricos sejam números válidos
    if (result.meta) {
      const totalSpent = typeof result.meta.totalSpent === 'number' 
        ? result.meta.totalSpent 
        : parseFloat(String(result.meta.totalSpent || "0"));
        
      const dailyBudget = typeof result.meta.dailyBudget === 'number' 
        ? result.meta.dailyBudget 
        : parseFloat(String(result.meta.dailyBudget || "0"));
        
      result.meta.totalSpent = isNaN(totalSpent) ? 0 : totalSpent;
      result.meta.dailyBudget = isNaN(dailyBudget) ? 0 : dailyBudget;
      
      console.log("[useMetaResponseProcessor] Valores finais após processamento:");
      console.log("- Total gasto:", result.meta.totalSpent);
      console.log("- Orçamento diário:", result.meta.dailyBudget);
    }
    
    setAnalysis(result as SimpleAnalysisResult);
    
    toast({
      title: "Análise concluída",
      description: "Dados do Meta Ads obtidos com sucesso!",
    });
  };

  /**
   * Processa detalhes de erro para apresentação
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
    processErrorDetails,
    setAnalysis
  };
};
