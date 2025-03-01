
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
  const { toast } = useToast();

  const fetchAnalysis = async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      console.log("Buscando análise para o cliente:", clientId);
      
      // 1. Verificar se o cliente existe e buscar seus dados
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id")
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
      
      setClient(clientData as Client);
      console.log("Cliente encontrado:", clientData);
      
      // 2. Verificar se há token configurado
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .single();
      
      if (tokenError) {
        throw new Error(`Erro ao buscar token do Meta Ads: ${tokenError.message}`);
      }
      
      if (!tokenData?.value) {
        throw new Error("Token do Meta Ads não configurado");
      }
      
      console.log("Token Meta Ads encontrado");
      
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
      
      console.log("Período de análise:", formattedStartDate, "a", formattedEndDate);
      
      // 4. Chamar a função Edge do Supabase
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
      
      console.log("Enviando payload para função Edge:", JSON.stringify(payload, null, 2));
      
      const { data: result, error: functionError } = await supabase.functions.invoke(
        "daily-budget-reviews",
        { body: payload }
      );
      
      if (functionError) {
        console.error("Erro na função Edge:", functionError);
        throw new Error(`Erro ao obter dados do Meta Ads: ${functionError.message || "Erro desconhecido"}`);
      }
      
      if (!result) {
        throw new Error("A função retornou dados vazios ou inválidos");
      }
      
      console.log("Resposta recebida da API Meta Ads:", result);
      
      // Verificando estrutura da resposta para garantir debug
      if (result.meta && result.meta.campaigns) {
        console.log("Campanhas recebidas:");
        const totalFromCampaigns = result.meta.campaigns.reduce(
          (total: number, campaign: any) => total + parseFloat(campaign.spend.toString() || "0"), 
          0
        );
        console.log(`Total das campanhas individuais: ${totalFromCampaigns}`);
        console.log(`Total geral reportado: ${result.meta.totalSpent}`);
        
        if (Math.abs(totalFromCampaigns - result.meta.totalSpent) > 0.01) {
          console.warn("AVISO: Discrepância entre o total reportado e a soma das campanhas!");
        }
      }
      
      // Verificar valores numéricos
      if (result.meta) {
        if (typeof result.meta.totalSpent !== 'number') {
          result.meta.totalSpent = parseFloat(result.meta.totalSpent);
          console.log("Convertido totalSpent para número:", result.meta.totalSpent);
        }
        
        if (typeof result.meta.dailyBudget !== 'number') {
          result.meta.dailyBudget = parseFloat(result.meta.dailyBudget);
          console.log("Convertido dailyBudget para número:", result.meta.dailyBudget);
        }
        
        if (result.meta.campaigns) {
          result.meta.campaigns = result.meta.campaigns.map((campaign: any) => ({
            ...campaign,
            spend: typeof campaign.spend === 'number' ? campaign.spend : parseFloat(campaign.spend || "0")
          }));
        }
      }
      
      setAnalysis(result as SimpleAnalysisResult);
      
      toast({
        title: "Análise concluída",
        description: "Dados do Meta Ads obtidos com sucesso!",
      });
      
    } catch (err) {
      console.error("Erro na análise:", err);
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
    fetchAnalysis
  };
};
