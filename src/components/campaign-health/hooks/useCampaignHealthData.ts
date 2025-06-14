
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CampaignHealthData {
  id: string;
  company_name: string;
  meta_account_id?: string;
  google_account_id?: string;
  today_spend: number;
  today_impressions: number;
  health_status: "healthy" | "warning" | "error" | "no-data";
  error_campaigns_count: number;
  last_activity: string;
}

interface HealthMetrics {
  totalClients: number;
  healthyClients: number;
  problemClients: number;
  totalSpendToday: number;
  totalImpressionsToday: number;
  clientsWithErrors: number;
}

export const useCampaignHealthData = () => {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Buscar dados consolidados de saúde das campanhas
  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign-health-data'],
    queryFn: async (): Promise<CampaignHealthData[]> => {
      console.log("🔍 Buscando dados de saúde das campanhas...");
      
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          company_name,
          meta_account_id,
          google_account_id,
          status
        `)
        .eq('status', 'active');

      if (clientsError) throw clientsError;

      // Para cada cliente, buscar dados de hoje das duas plataformas
      const healthData: CampaignHealthData[] = [];
      
      for (const client of clients || []) {
        let todaySpend = 0;
        let todayImpressions = 0;
        let healthStatus: "healthy" | "warning" | "error" | "no-data" = "no-data";
        let errorCampaignsCount = 0;
        let lastActivity = "";

        // Dados do Meta Ads
        if (client.meta_account_id) {
          const { data: metaReview } = await supabase
            .from('daily_budget_reviews')
            .select('*')
            .eq('client_id', client.id)
            .eq('review_date', today)
            .single();

          if (metaReview) {
            todaySpend += metaReview.meta_total_spent || 0;
            lastActivity = metaReview.created_at;
          }
        }

        // Dados do Google Ads
        if (client.google_account_id) {
          const { data: googleReview } = await supabase
            .from('google_ads_reviews')
            .select('*')
            .eq('client_id', client.id)
            .eq('review_date', today)
            .single();

          if (googleReview) {
            todaySpend += googleReview.google_total_spent || 0;
            todayImpressions += googleReview.google_impressions || 0;
            lastActivity = googleReview.created_at;
          }
        }

        // Determinar status de saúde
        if (todaySpend === 0 && (client.meta_account_id || client.google_account_id)) {
          healthStatus = "warning"; // Sem gasto hoje
        } else if (todaySpend > 0) {
          healthStatus = "healthy";
        }

        // Simular detecção de campanhas com erro (aqui você integraria com APIs reais)
        errorCampaignsCount = Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0;
        if (errorCampaignsCount > 0) {
          healthStatus = "error";
        }

        healthData.push({
          id: client.id,
          company_name: client.company_name,
          meta_account_id: client.meta_account_id,
          google_account_id: client.google_account_id,
          today_spend: todaySpend,
          today_impressions: todayImpressions,
          health_status: healthStatus,
          error_campaigns_count: errorCampaignsCount,
          last_activity: lastActivity,
        });
      }

      console.log(`✅ Dados de saúde carregados para ${healthData.length} clientes`);
      return healthData;
    },
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  });

  // Calcular métricas consolidadas
  const metrics: HealthMetrics | null = rawData ? {
    totalClients: rawData.length,
    healthyClients: rawData.filter(c => c.health_status === "healthy").length,
    problemClients: rawData.filter(c => c.health_status === "error" || c.health_status === "warning").length,
    totalSpendToday: rawData.reduce((sum, c) => sum + c.today_spend, 0),
    totalImpressionsToday: rawData.reduce((sum, c) => sum + c.today_impressions, 0),
    clientsWithErrors: rawData.filter(c => c.error_campaigns_count > 0).length,
  } : null;

  // Atualizar timestamp quando dados são carregados
  useEffect(() => {
    if (rawData) {
      setLastUpdated(new Date().toISOString());
    }
  }, [rawData]);

  const refreshData = async () => {
    console.log("🔄 Atualizando dados de saúde das campanhas...");
    try {
      await refetch();
      toast({
        title: "Dados atualizados",
        description: "Os dados de saúde das campanhas foram atualizados com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro na atualização",
        description: error.message || "Ocorreu um erro ao atualizar os dados",
        variant: "destructive",
      });
    }
  };

  return {
    data: rawData || [],
    isLoading,
    error,
    metrics,
    refreshData,
    lastUpdated,
  };
};
