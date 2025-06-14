
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Estrutura de dados de saúde de campanhas com dados reais
type Platform = "Meta Ads" | "Google Ads";
export type CampaignStatus = "ok" | "warning" | "error" | "nodata";

export interface CampaignHealth {
  clientId: string;
  clientName: string;
  companyEmail?: string;
  platforms: Array<{
    name: Platform;
    costToday: number;
    impressionsToday?: number;
    errors: string[];
    status: CampaignStatus;
    accountId?: string;
    accountName?: string;
  }>;
}

// Busca dados reais de saúde das campanhas
async function fetchRealHealthData(): Promise<CampaignHealth[]> {
  console.log("🔍 Buscando dados reais de saúde das campanhas...");
  
  try {
    // Buscar dados consolidados com JOINs para obter dados do dia atual
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        company_name,
        contact_name,
        daily_budget_reviews!left (
          meta_total_spent,
          meta_daily_budget_current,
          meta_account_id,
          meta_account_name,
          review_date
        ),
        google_ads_reviews!left (
          google_total_spent,
          google_daily_budget_current,
          google_account_id,
          google_account_name,
          review_date
        ),
        client_meta_accounts!left (
          account_id,
          account_name,
          status
        ),
        client_google_accounts!left (
          account_id,
          account_name,
          status
        )
      `)
      .eq('status', 'active')
      .eq('daily_budget_reviews.review_date', new Date().toISOString().split('T')[0])
      .eq('google_ads_reviews.review_date', new Date().toISOString().split('T')[0])
      .eq('client_meta_accounts.status', 'active')
      .eq('client_google_accounts.status', 'active');

    if (clientsError) {
      console.error("❌ Erro ao buscar dados dos clientes:", clientsError);
      throw clientsError;
    }

    console.log(`✅ Dados brutos obtidos: ${clientsData?.length || 0} clientes`);

    // Processar dados para o formato esperado
    const healthData: CampaignHealth[] = (clientsData || []).map(client => {
      const metaReview = Array.isArray(client.daily_budget_reviews) 
        ? client.daily_budget_reviews[0] 
        : client.daily_budget_reviews;
      
      const googleReview = Array.isArray(client.google_ads_reviews)
        ? client.google_ads_reviews[0]
        : client.google_ads_reviews;

      const metaAccount = Array.isArray(client.client_meta_accounts)
        ? client.client_meta_accounts[0]
        : client.client_meta_accounts;

      const googleAccount = Array.isArray(client.client_google_accounts)
        ? client.client_google_accounts[0]
        : client.client_google_accounts;

      // Determinar status e erros para Meta Ads
      const metaCostToday = metaReview?.meta_total_spent || 0;
      const metaHasAccount = !!metaAccount?.account_id;
      let metaErrors: string[] = [];
      let metaStatus: CampaignStatus = "nodata";

      if (metaHasAccount) {
        if (metaCostToday > 0) {
          metaStatus = "ok";
          metaErrors = [];
        } else if (metaReview && metaCostToday === 0) {
          metaStatus = "error";
          metaErrors = ["Sem veiculação"];
        } else {
          metaStatus = "nodata";
          metaErrors = ["Dados não disponíveis"];
        }
      }

      // Determinar status e erros para Google Ads
      const googleCostToday = googleReview?.google_total_spent || 0;
      const googleHasAccount = !!googleAccount?.account_id;
      let googleErrors: string[] = [];
      let googleStatus: CampaignStatus = "nodata";

      if (googleHasAccount) {
        if (googleCostToday > 0) {
          googleStatus = "ok";
          googleErrors = [];
        } else if (googleReview && googleCostToday === 0) {
          googleStatus = "error";
          googleErrors = ["Sem veiculação"];
        } else {
          googleStatus = "nodata";
          googleErrors = ["Dados não disponíveis"];
        }
      }

      const platforms = [];

      // Adicionar Meta Ads se o cliente tem conta configurada
      if (metaHasAccount) {
        platforms.push({
          name: "Meta Ads" as Platform,
          costToday: metaCostToday,
          impressionsToday: undefined, // TODO: Buscar via API quando necessário
          errors: metaErrors,
          status: metaStatus,
          accountId: metaAccount.account_id,
          accountName: metaAccount.account_name
        });
      }

      // Adicionar Google Ads se o cliente tem conta configurada
      if (googleHasAccount) {
        platforms.push({
          name: "Google Ads" as Platform,
          costToday: googleCostToday,
          impressionsToday: undefined, // TODO: Buscar via API quando necessário
          errors: googleErrors,
          status: googleStatus,
          accountId: googleAccount.account_id,
          accountName: googleAccount.account_name
        });
      }

      return {
        clientId: client.id,
        clientName: client.company_name,
        companyEmail: client.contact_name || undefined,
        platforms
      };
    });

    // Filtrar apenas clientes que têm pelo menos uma plataforma configurada
    const filteredData = healthData.filter(client => client.platforms.length > 0);
    
    console.log(`📊 Dados processados: ${filteredData.length} clientes com campanhas ativas`);
    return filteredData;

  } catch (error) {
    console.error("❌ Erro ao processar dados de saúde:", error);
    throw error;
  }
}

// Hook para buscar dados com refresh em massa
async function triggerMassReview() {
  console.log("🔄 Iniciando revisão em massa...");
  
  try {
    // Buscar todos os clientes ativos com contas configuradas
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id,
        company_name,
        client_meta_accounts!left (account_id, status),
        client_google_accounts!left (account_id, status)
      `)
      .eq('status', 'active')
      .eq('client_meta_accounts.status', 'active')
      .eq('client_google_accounts.status', 'active');

    if (error) throw error;

    const results = { success: 0, failed: 0, total: clients?.length || 0 };
    
    console.log(`📋 Processando revisão para ${results.total} clientes...`);

    // Processar clientes em lotes para não sobrecarregar as APIs
    for (const client of clients || []) {
      try {
        const hasMetaAccount = client.client_meta_accounts?.some(acc => acc.status === 'active');
        const hasGoogleAccount = client.client_google_accounts?.some(acc => acc.status === 'active');

        // Chamar edge functions para atualizar dados (usando period do mês atual)
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        if (hasMetaAccount) {
          await supabase.functions.invoke('daily-meta-review', {
            body: {
              clientId: client.id,
              reviewDate: today.toISOString().split('T')[0],
              fetchRealData: true
            }
          });
        }

        if (hasGoogleAccount) {
          await supabase.functions.invoke('daily-google-review', {
            body: {
              clientId: client.id,
              reviewDate: today.toISOString().split('T')[0],
              fetchRealData: true
            }
          });
        }

        results.success++;
        console.log(`✅ Cliente ${client.company_name} processado com sucesso`);
        
      } catch (clientError) {
        console.error(`❌ Erro ao processar cliente ${client.company_name}:`, clientError);
        results.failed++;
      }
    }

    console.log(`📈 Revisão em massa concluída: ${results.success} sucessos, ${results.failed} falhas`);
    return results;

  } catch (error) {
    console.error("❌ Erro na revisão em massa:", error);
    throw error;
  }
}

export function useCampaignHealthData() {
  const [filterValue, setFilterValue] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query para buscar dados com cache de 5 minutos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["campaign-health-real"],
    queryFn: fetchRealHealthData,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000 // Auto-refresh a cada 5 minutos
  });

  // Função para ações dos botões
  function handleAction(action: "details" | "review" | "mass-review", clientId?: string, platform?: Platform) {
    if (action === "details" && clientId && platform) {
      const platformParam = encodeURIComponent(platform.toLowerCase().replace(' ', ''));
      window.open(`/clientes/${clientId}?platform=${platformParam}`, "_blank");
    }
    
    if (action === "review" && clientId && platform) {
      const platformParam = encodeURIComponent(platform.toLowerCase().replace(' ', ''));
      window.open(`/revisao-diaria-avancada?clienteId=${clientId}&platform=${platformParam}`, "_blank");
    }
    
    if (action === "mass-review") {
      handleMassReview();
    }
  }

  // Revisão em massa com feedback
  async function handleMassReview() {
    setIsRefreshing(true);
    try {
      const results = await triggerMassReview();
      
      // Refetch dos dados após a revisão
      await refetch();
      
      console.log(`🎉 Revisão concluída: ${results.success}/${results.total} clientes processados`);
      
    } catch (error) {
      console.error("❌ Erro na revisão em massa:", error);
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    data,
    isLoading,
    error: error ? "Erro ao carregar dados de saúde das campanhas." : null,
    filterValue,
    setFilterValue,
    handleAction,
    isRefreshing,
    refetch
  };
}
