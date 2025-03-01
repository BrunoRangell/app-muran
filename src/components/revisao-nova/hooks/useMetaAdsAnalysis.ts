import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SimpleAnalysisResult, SimpleMetaData, SimpleMetaCampaign, MetaDateRange } from "@/components/daily-reviews/hooks/types";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  google_ads_id: string | null;
  status: string;
  meta_token_test: boolean;
  edge_function_test: boolean;
}

interface ApiResponse {
  campaigns: any[];
}

const accessToken = import.meta.env.VITE_META_ACCESS_TOKEN;

const fetchMetaAdsData = async (accountId: string): Promise<ApiResponse> => {
  try {
    const campaignsResponse = await axios.get(`https://graph.facebook.com/v20.0/act_${accountId}/campaigns`, {
      params: {
        fields: 'id,name,status,objective,start_time,stop_time,daily_budget',
        access_token: accessToken,
      },
    });

    const campaigns = campaignsResponse.data.data;

    // Para cada campanha, buscar os AdSets
    const campaignsWithAdsets = await Promise.all(
      campaigns.map(async (campaign: any) => {
        const adsetsResponse = await axios.get(`https://graph.facebook.com/v20.0/${campaign.id}/adsets`, {
          params: {
            fields: 'id,name,status,daily_budget,start_time,end_time',
            access_token: accessToken,
          },
        });
        
        // Adicionar os AdSets na campanha
        campaign.adsets = adsetsResponse.data.data;
        return campaign;
      })
    );

    // Buscar insights para cada campanha
    const campaignsWithInsights = await Promise.all(
      campaignsWithAdsets.map(async (campaign: any) => {
        const insightsResponse = await axios.get(`https://graph.facebook.com/v20.0/${campaign.id}/insights`, {
          params: {
            metric: 'spend',
            time_range: {
              since: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
              until: new Date().toISOString().slice(0, 10),
            },
            access_token: accessToken,
          },
        });
        
        // Adicionar os insights na campanha
        campaign.insights = insightsResponse.data.data;
        return campaign;
      })
    );

    return { campaigns: campaignsWithInsights };
  } catch (error: any) {
    console.error("Erro ao buscar dados do Meta Ads:", error);
    throw new Error(error.message || "Erro ao buscar dados do Meta Ads");
  }
};

export const useMetaAdsAnalysis = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [analysis, setAnalysis] = useState<SimpleAnalysisResult | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testMetaToken, setTestMetaToken] = useState<boolean>(false);
  const [testEdgeFunction, setTestEdgeFunction] = useState<boolean>(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("status", "active");

      if (error) {
        throw new Error(error.message);
      }

      return data as Client[];
    },
  });

  const fetchAnalysis = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setRawApiResponse(null);
    setDebugInfo(null);

    const selectedClient = clients?.find((c) => c.id === clientId);
    setClient(selectedClient);

    if (!selectedClient?.meta_account_id) {
      setError("Cliente não possui um ID de conta Meta válido.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchMetaAdsData(selectedClient.meta_account_id);
      setRawApiResponse(response);

      const processedData = processResponse(response);
      setAnalysis(processedData);
      setTestMetaToken(selectedClient.meta_token_test);
      setTestEdgeFunction(selectedClient.edge_function_test);
    } catch (err: any) {
      setError(err.message || "Erro ao processar análise.");
      console.error("Erro durante a análise:", err);
      toast({
        title: "Erro ao analisar cliente",
        description: err.message || "Ocorreu um erro ao analisar o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [clients, toast]);

  const processResponse = (response: ApiResponse): SimpleAnalysisResult => {
    let totalSpent = 0;
    let campaigns: SimpleMetaCampaign[] = [];
    let dateRange: MetaDateRange = {};
  
    if (response.campaigns && Array.isArray(response.campaigns)) {
      response.campaigns.forEach((campaign: any) => {
        if (campaign.insights && Array.isArray(campaign.insights) && campaign.insights.length > 0) {
          const insight = campaign.insights[0];
          totalSpent += Number(insight.spend);
  
          campaigns.push({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend: insight.spend,
          });
        }
      });
  
      // Determinar o período com base nas campanhas
      if (response.campaigns.length > 0) {
        const firstCampaign = response.campaigns[0];
        dateRange = {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString(),
          end: new Date().toLocaleDateString(),
        };
      }
    }
  
    // Calcular o orçamento diário atual com base nas campanhas e conjuntos de anúncios
    let dailyBudget = 0;
    
    // Para cada campanha ativa
    if (response.campaigns && Array.isArray(response.campaigns)) {
      response.campaigns.forEach(campaign => {
        // Se a campanha estiver ativa e tiver orçamento no nível de campanha
        if (campaign.status === 'ACTIVE' && campaign.daily_budget) {
          dailyBudget += Number(campaign.daily_budget) / 100; // Convertendo de centavos para reais
        }
        
        // Se a campanha estiver ativa mas não tiver orçamento definido
        // Verificamos os conjuntos de anúncios
        if (campaign.status === 'ACTIVE' && campaign.adsets && Array.isArray(campaign.adsets)) {
          campaign.adsets.forEach(adset => {
            if (adset.status === 'ACTIVE' && adset.daily_budget) {
              dailyBudget += Number(adset.daily_budget) / 100;
            }
          });
        }
      });
    }
    
    return {
      meta: {
        totalSpent: totalSpent,
        campaigns: campaigns,
        dateRange: dateRange,
        dailyBudget: dailyBudget,
      },
    };
  };

  return {
    client,
    analysis,
    isLoading,
    error,
    fetchAnalysis,
    debugInfo,
    rawApiResponse,
    testMetaToken,
    testEdgeFunction
  };
};
