
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchClientAnalysis, updateClientAnalysis } from "./services/clientAnalysisService";

export const useClientAnalysis = (clientId: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const { toast } = useToast();

  // Buscar dados do cliente e suas contas
  const fetchClientData = async () => {
    try {
      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar dados do cliente:", error);
        return;
      }

      // Buscar contas Meta do cliente
      const { data: metaAccounts } = await supabase
        .from("client_accounts")
        .select("*")
        .eq("client_id", clientId)
        .eq("platform", "meta")
        .eq("status", "active");

      setClientData({
        ...client,
        meta_accounts: metaAccounts || [],
      });
    } catch (error) {
      console.error("Erro ao buscar dados do cliente:", error);
    }
  };

  // Buscar análise existente
  const loadAnalysis = async () => {
    try {
      const data = await fetchClientAnalysis(clientId);
      setAnalysisData(data);
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
    }
  };

  // Analisar cliente
  const analyzeClient = async () => {
    if (!clientData) {
      toast({
        title: "Erro",
        description: "Dados do cliente não carregados",
        variant: "destructive",
      });
      return;
    }

    // Verificar se cliente possui conta Meta
    if (!clientData.meta_accounts || clientData.meta_accounts.length === 0) {
      toast({
        title: "Erro",
        description: "Cliente não possui configuração de Meta Ads",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Buscar token do Meta Ads
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .single();

      if (tokenError || !tokenData?.value) {
        throw new Error("Token do Meta Ads não encontrado");
      }

      // Preparar datas para análise
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const formattedStartDate = startDate.toISOString().split("T")[0];

      // Usar a primeira conta Meta ativa
      const metaAccount = clientData.meta_accounts[0];

      // Chamar a função Edge para análise
      console.log("Chamando Meta Budget Calculator para o cliente:", clientId);

      const { data, error } = await supabase.functions.invoke(
        "meta-budget-calculator",
        {
          body: {
            accountId: metaAccount.account_id,
            accessToken: tokenData.value,
            dateRange: {
              start: formattedStartDate,
              end: today,
            },
            fetchSeparateInsights: true,
          },
        }
      );

      if (error) {
        console.error("Erro na função Edge:", error);
        throw new Error(`Erro na análise do orçamento: ${error.message}`);
      }

      console.log("Resposta da função Edge:", data);

      if (!data) {
        throw new Error("A resposta da API não contém dados");
      }

      // Extrair valores da resposta
      const metaDailyBudget = data.totalDailyBudget || 0;
      const metaTotalSpent = data.totalSpent || 0;

      // Preparar dados de análise
      const analysisResult = {
        meta_daily_budget_current: metaDailyBudget,
        meta_total_spent: metaTotalSpent,
        analyzed_at: new Date().toISOString(),
      };

      // Salvar análise
      await updateClientAnalysis(clientId, analysisResult);
      setAnalysisData(analysisResult);

      toast({
        title: "Análise concluída",
        description: "Cliente analisado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro na análise:", error);
      toast({
        title: "Erro na análise",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientData();
      loadAnalysis();
    }
  }, [clientId]);

  return {
    isAnalyzing,
    analysisData,
    clientData,
    analyzeClient,
    refreshAnalysis: loadAnalysis,
  };
};
