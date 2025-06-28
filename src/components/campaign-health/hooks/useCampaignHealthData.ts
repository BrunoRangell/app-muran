import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Estrutura reformulada para separar Meta e Google Ads
export type CampaignStatus = "ok" | "warning" | "error" | "nodata";

export interface PlatformData {
  costToday: number;
  impressionsToday?: number;
  errors: string[];
  status: CampaignStatus;
  accountId?: string;
  accountName?: string;
}

export interface CampaignHealth {
  clientId: string;
  clientName: string;
  companyEmail?: string;
  metaAds?: PlatformData | PlatformData[]; // Pode ser uma ou múltiplas contas
  googleAds?: PlatformData | PlatformData[]; // Pode ser uma ou múltiplas contas
}

// Função auxiliar para determinar status baseado nos dados
function determineStatus(
  costToday: number, 
  hasAccount: boolean, 
  hasReviewData: boolean
): { status: CampaignStatus; errors: string[] } {
  if (!hasAccount) {
    return { status: "nodata", errors: ["Conta não configurada"] };
  }
  
  if (!hasReviewData) {
    return { status: "nodata", errors: ["Dados não disponíveis"] };
  }
  
  if (costToday > 0) {
    return { status: "ok", errors: [] };
  } else {
    return { status: "error", errors: ["Sem veiculação hoje"] };
  }
}

// Busca dados reais de saúde das campanhas com suporte a múltiplas contas
async function fetchCampaignHealthData(): Promise<CampaignHealth[]> {
  console.log("🔍 Buscando dados de saúde das campanhas com múltiplas contas...");
  
  try {
    // Buscar TODOS os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name, contact_name')
      .eq('status', 'active')
      .order('company_name');

    if (clientsError) {
      console.error("❌ Erro ao buscar clientes:", clientsError);
      throw clientsError;
    }

    console.log(`✅ Encontrados ${clients?.length || 0} clientes ativos`);

    const healthData: CampaignHealth[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const client of clients || []) {
      console.log(`📊 Processando cliente: ${client.company_name}`);
      
      let clientData: CampaignHealth = {
        clientId: client.id,
        clientName: client.company_name,
        companyEmail: client.contact_name || undefined,
      };

      // Buscar TODAS as contas Meta do cliente
      const { data: metaAccounts } = await supabase
        .from('client_meta_accounts')
        .select('account_id, account_name, is_primary')
        .eq('client_id', client.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false }); // Principais primeiro

      if (metaAccounts && metaAccounts.length > 0) {
        const metaAccountsData: PlatformData[] = [];
        
        for (const metaAccount of metaAccounts) {
          // Buscar dados de review para esta conta específica
          const { data: metaReview } = await supabase
            .from('daily_budget_reviews')
            .select('meta_total_spent, meta_daily_budget_current')
            .eq('client_id', client.id)
            .eq('meta_account_id', metaAccount.account_id)
            .eq('review_date', today)
            .maybeSingle();

          const metaCostToday = metaReview?.meta_total_spent || 0;
          const hasMetaReviewData = !!metaReview;
          const metaStatus = determineStatus(metaCostToday, true, hasMetaReviewData);
          
          metaAccountsData.push({
            costToday: metaCostToday,
            impressionsToday: undefined,
            errors: metaStatus.errors,
            status: metaStatus.status,
            accountId: metaAccount.account_id,
            accountName: metaAccount.account_name
          });
        }
        
        clientData.metaAds = metaAccountsData.length === 1 ? metaAccountsData[0] : metaAccountsData;
      }

      // Buscar TODAS as contas Google do cliente
      const { data: googleAccounts } = await supabase
        .from('client_google_accounts')
        .select('account_id, account_name, is_primary')
        .eq('client_id', client.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false }); // Principais primeiro

      if (googleAccounts && googleAccounts.length > 0) {
        const googleAccountsData: PlatformData[] = [];
        
        for (const googleAccount of googleAccounts) {
          // Buscar dados de review para esta conta específica
          const { data: googleReview } = await supabase
            .from('google_ads_reviews')
            .select('google_total_spent, google_daily_budget_current')
            .eq('client_id', client.id)
            .eq('google_account_id', googleAccount.account_id)
            .eq('review_date', today)
            .maybeSingle();

          const googleCostToday = googleReview?.google_total_spent || 0;
          const hasGoogleReviewData = !!googleReview;
          const googleStatus = determineStatus(googleCostToday, true, hasGoogleReviewData);
          
          googleAccountsData.push({
            costToday: googleCostToday,
            impressionsToday: undefined,
            errors: googleStatus.errors,
            status: googleStatus.status,
            accountId: googleAccount.account_id,
            accountName: googleAccount.account_name
          });
        }
        
        clientData.googleAds = googleAccountsData.length === 1 ? googleAccountsData[0] : googleAccountsData;
      }

      // Adicionar cliente apenas se tiver pelo menos uma plataforma configurada
      if (clientData.metaAds || clientData.googleAds) {
        healthData.push(clientData);
      }
    }

    console.log(`📈 Dados processados: ${healthData.length} clientes com campanhas (incluindo contas múltiplas)`);
    return healthData;

  } catch (error) {
    console.error("❌ Erro ao processar dados de saúde:", error);
    throw error;
  }
}

// Hook para buscar dados com refresh em massa
async function triggerMassReview() {
  console.log("🔄 Iniciando revisão em massa...");
  
  try {
    // Buscar todos os clientes ativos
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'active');

    if (error) throw error;

    const results = { success: 0, failed: 0, total: clients?.length || 0 };
    
    console.log(`📋 Processando revisão para ${results.total} clientes...`);

    // Processar clientes em lotes
    for (const client of clients || []) {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Chamar edge functions para atualizar dados
        await Promise.all([
          supabase.functions.invoke('daily-meta-review', {
            body: {
              clientId: client.id,
              reviewDate: today,
              fetchRealData: true
            }
          }),
          supabase.functions.invoke('daily-google-review', {
            body: {
              clientId: client.id,
              reviewDate: today,
              fetchRealData: true
            }
          })
        ]);

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
    queryKey: ["campaign-health-new"],
    queryFn: fetchCampaignHealthData,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000 // Auto-refresh a cada 5 minutos
  });

  // Função para ações dos botões
  function handleAction(action: "details" | "review" | "mass-review", clientId?: string, platform?: string) {
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
