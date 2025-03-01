
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string;
}

export const useMetaAdsAnalysis = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [analysis, setAnalysis] = useState<SimpleAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const { toast } = useToast();

  const fetchAnalysis = async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setRawApiResponse(null);

    try {
      console.log("[useMetaAdsAnalysis] Iniciando análise para cliente:", clientId);
      
      // 1. Verificar se o cliente existe e buscar seus dados
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id")
        .eq("id", clientId)
        .single();
      
      if (clientError) {
        console.error("[useMetaAdsAnalysis] Erro ao buscar cliente:", clientError);
        throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
      }
      
      if (!clientData) {
        console.error("[useMetaAdsAnalysis] Cliente não encontrado:", clientId);
        throw new Error("Cliente não encontrado");
      }
      
      if (!clientData.meta_account_id) {
        console.error("[useMetaAdsAnalysis] Cliente sem ID Meta Ads:", clientData);
        throw new Error("Cliente não possui ID do Meta Ads configurado");
      }
      
      setClient(clientData as Client);
      console.log("[useMetaAdsAnalysis] Cliente encontrado:", clientData);
      
      // 2. Verificar se há token configurado
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .single();
      
      if (tokenError) {
        console.error("[useMetaAdsAnalysis] Erro ao buscar token do Meta Ads:", tokenError);
        throw new Error(`Erro ao buscar token do Meta Ads: ${tokenError.message}`);
      }
      
      if (!tokenData?.value) {
        console.error("[useMetaAdsAnalysis] Token Meta Ads não encontrado");
        throw new Error("Token do Meta Ads não configurado");
      }
      
      console.log("[useMetaAdsAnalysis] Token Meta Ads encontrado");
      
      // 3. Preparar datas para o período atual
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Primeiro dia do mês atual
      const startDate = new Date(currentYear, currentMonth, 1);
      // Último dia do mês atual
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      const formattedToday = today.toISOString().split('T')[0];
      
      console.log("[useMetaAdsAnalysis] Período de análise:", formattedStartDate, "a", formattedEndDate);
      
      // 4. Chamar a função Edge do Supabase diretamente com o período atual completo
      const payload = {
        method: "getMetaAdsData",
        clientId,
        reviewDate: formattedToday,
        accessToken: tokenData.value,
        clientName: clientData.company_name,
        metaAccountId: clientData.meta_account_id,
        dateRange: {
          start: formattedStartDate,
          end: formattedEndDate
        }
      };
      
      console.log("[useMetaAdsAnalysis] Enviando payload para função Edge:", 
        JSON.stringify({
          ...payload,
          accessToken: "***OMITIDO***" // Não exibir o token no console
        }, null, 2)
      );
      
      const { data: result, error: functionError } = await supabase.functions.invoke(
        "daily-budget-reviews",
        { body: payload }
      );
      
      if (functionError) {
        console.error("[useMetaAdsAnalysis] Erro na função Edge:", functionError);
        throw new Error(`Erro ao obter dados do Meta Ads: ${functionError.message || "Erro desconhecido"}`);
      }
      
      if (!result) {
        console.error("[useMetaAdsAnalysis] Função retornou dados vazios ou inválidos");
        throw new Error("A função retornou dados vazios ou inválidos");
      }
      
      // Guardar a resposta bruta para depuração
      setRawApiResponse(result);
      
      console.log("[useMetaAdsAnalysis] Resposta completa da API Meta Ads:", result);
      
      // Verificação rigorosa dos dados recebidos
      if (!result.meta || typeof result.meta.totalSpent === 'undefined' || !result.meta.campaigns) {
        console.error("[useMetaAdsAnalysis] Dados recebidos inválidos ou incompletos:", result);
        throw new Error("Os dados recebidos da API do Meta Ads estão incompletos ou em formato inválido");
      }
      
      // Logs detalhados para verificação dos valores
      console.log("[useMetaAdsAnalysis] Meta dados recebidos:");
      console.log("- Total gasto:", result.meta.totalSpent);
      console.log("- Orçamento diário:", result.meta.dailyBudget);
      console.log("- Período:", result.meta.dateRange);
      console.log("- Número de campanhas:", result.meta.campaigns.length);
      
      // Verificar cada campanha individualmente
      if (result.meta.campaigns && result.meta.campaigns.length > 0) {
        console.log("[useMetaAdsAnalysis] Detalhes das campanhas:");
        result.meta.campaigns.forEach((campaign: any, index: number) => {
          console.log(`Campanha ${index + 1}: ${campaign.name}`);
          console.log(`- ID: ${campaign.id}`);
          console.log(`- Status: ${campaign.status}`);
          console.log(`- Gasto: ${campaign.spend}`);
        });
        
        // Validação do total das campanhas vs total reportado
        const totalFromCampaigns = result.meta.campaigns.reduce(
          (total: number, campaign: any) => total + parseFloat(campaign.spend.toString() || "0"), 
          0
        );
        
        console.log(`[useMetaAdsAnalysis] Total calculado manualmente das campanhas: ${totalFromCampaigns}`);
        console.log(`[useMetaAdsAnalysis] Total reportado pela API: ${result.meta.totalSpent}`);
        
        if (Math.abs(totalFromCampaigns - result.meta.totalSpent) > 0.01) {
          console.warn("[useMetaAdsAnalysis] AVISO: Discrepância entre o total reportado e a soma das campanhas!");
        }
      }
      
      // Garantir que todos os valores numéricos sejam números
      if (result.meta) {
        if (typeof result.meta.totalSpent !== 'number') {
          const converted = parseFloat(result.meta.totalSpent);
          result.meta.totalSpent = isNaN(converted) ? 0 : converted;
          console.log("[useMetaAdsAnalysis] Convertido totalSpent para número:", result.meta.totalSpent);
        }
        
        if (typeof result.meta.dailyBudget !== 'number') {
          const converted = parseFloat(result.meta.dailyBudget);
          result.meta.dailyBudget = isNaN(converted) ? 0 : converted;
          console.log("[useMetaAdsAnalysis] Convertido dailyBudget para número:", result.meta.dailyBudget);
        }
        
        if (result.meta.campaigns) {
          result.meta.campaigns = result.meta.campaigns.map((campaign: any) => {
            const spendValue = typeof campaign.spend === 'number' 
              ? campaign.spend 
              : parseFloat(campaign.spend || "0");
            
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
      
    } catch (err) {
      console.error("[useMetaAdsAnalysis] Erro na análise:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
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
    rawApiResponse
  };
};
