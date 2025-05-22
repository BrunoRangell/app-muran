
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Interfaces para tipagem
interface Campaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget: number;
  budget_remaining: number;
  adsets?: AdSet[];
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget: number;
  campaign_id: string;
}

interface CampaignInsight {
  campaign_id: string;
  spend: number;
  date_start: string;
  date_stop: string;
}

interface InsightResponse {
  data: CampaignInsight[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

// Função auxiliar para criar um cliente do Supabase
export const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Credenciais do Supabase não encontradas no ambiente');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Função para buscar token de acesso da Meta no banco de dados
export const getMetaAccessToken = async (supabase: any): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .single();
    
    if (error) throw error;
    if (!data?.value) throw new Error('Token de acesso Meta não encontrado');
    
    return data.value;
  } catch (error) {
    console.error('Erro ao buscar token de acesso Meta:', error.message);
    throw error;
  }
};

// Função para buscar campanhas ativas da conta Meta
export const fetchActiveCampaigns = async (accountId: string, accessToken: string): Promise<Campaign[]> => {
  try {
    console.log(`Buscando campanhas ativas para conta Meta ${accountId}`);
    
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/campaigns?fields=id,name,status,effective_status,daily_budget,budget_remaining&access_token=${accessToken}&limit=100`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API Meta: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      console.log('Nenhuma campanha retornada da API Meta');
      return [];
    }
    
    // Filtrar apenas campanhas ativas
    const activeCampaigns = data.data.filter((campaign: Campaign) => 
      campaign.status === 'ACTIVE' && campaign.effective_status === 'ACTIVE'
    );
    
    console.log(`Total de ${activeCampaigns.length} campanhas ativas encontradas`);
    
    return activeCampaigns;
  } catch (error) {
    console.error('Erro ao buscar campanhas ativas:', error.message);
    throw error;
  }
};

// Função para buscar conjuntos de anúncios ativos de uma campanha
export const fetchActiveAdSets = async (campaignId: string, accessToken: string): Promise<AdSet[]> => {
  try {
    console.log(`Buscando conjuntos de anúncios ativos para campanha ${campaignId}`);
    
    const url = `https://graph.facebook.com/v19.0/${campaignId}/adsets?fields=id,name,status,effective_status,daily_budget,campaign_id&access_token=${accessToken}&limit=100`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API Meta: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      return [];
    }
    
    // Filtrar apenas conjuntos de anúncios ativos
    const activeAdSets = data.data.filter((adset: AdSet) => 
      adset.status === 'ACTIVE' && adset.effective_status === 'ACTIVE'
    );
    
    console.log(`Total de ${activeAdSets.length} conjuntos de anúncios ativos encontrados para campanha ${campaignId}`);
    
    return activeAdSets;
  } catch (error) {
    console.error(`Erro ao buscar conjuntos de anúncios para campanha ${campaignId}:`, error.message);
    return [];
  }
};

// Função para buscar insights (gastos) das campanhas no mês atual
export const fetchCampaignInsights = async (accountId: string, accessToken: string): Promise<CampaignInsight[]> => {
  try {
    console.log(`Buscando insights das campanhas para conta Meta ${accountId}`);
    
    // Obter primeiro e último dia do mês atual
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };
    
    const since = formatDate(firstDayOfMonth);
    const until = formatDate(today);
    
    console.log(`Buscando insights do período: ${since} até ${until}`);
    
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights?fields=campaign_id,spend&level=campaign&time_range={"since":"${since}","until":"${until}"}&access_token=${accessToken}&limit=500`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API Meta Insights: ${JSON.stringify(errorData)}`);
    }
    
    const data: InsightResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('Nenhum insight de campanha encontrado para o período');
      return [];
    }
    
    console.log(`Total de ${data.data.length} insights de campanhas encontrados`);
    
    return data.data;
  } catch (error) {
    console.error('Erro ao buscar insights das campanhas:', error.message);
    throw error;
  }
};

// Função principal para obter todos os dados necessários da API Meta
export const fetchMetaAdsData = async (accountId: string, accessToken: string) => {
  try {
    // 1. Buscar todas as campanhas ativas
    const campaigns = await fetchActiveCampaigns(accountId, accessToken);
    
    // 2. Para cada campanha ativa, buscar seus conjuntos de anúncios ativos
    for (const campaign of campaigns) {
      campaign.adsets = await fetchActiveAdSets(campaign.id, accessToken);
    }
    
    // 3. Buscar insights (gastos) de todas as campanhas no mês atual
    const insights = await fetchCampaignInsights(accountId, accessToken);
    
    // 4. Calcular orçamento diário total (campanhas + conjuntos)
    let totalDailyBudget = 0;
    
    // Soma dos orçamentos diários das campanhas ativas que têm orçamento no nível da campanha
    const campaignBudgets = campaigns
      .filter(campaign => campaign.daily_budget > 0)
      .reduce((sum, campaign) => sum + (campaign.daily_budget / 100), 0); // Dividido por 100 pois o valor vem em centavos
      
    totalDailyBudget += campaignBudgets;
    
    // Soma dos orçamentos diários dos conjuntos de anúncios ativos em campanhas que não têm orçamento no nível da campanha
    let adSetBudgets = 0;
    campaigns.forEach(campaign => {
      if (!campaign.daily_budget && campaign.adsets && campaign.adsets.length > 0) {
        const campaignAdSetBudget = campaign.adsets
          .filter(adset => adset.daily_budget > 0)
          .reduce((sum, adset) => sum + (adset.daily_budget / 100), 0); // Dividido por 100 pois o valor vem em centavos
          
        adSetBudgets += campaignAdSetBudget;
      }
    });
    
    totalDailyBudget += adSetBudgets;
    
    // 5. Calcular gasto total do mês atual
    const totalSpent = insights.reduce((sum, insight) => {
      return sum + parseFloat(insight.spend);
    }, 0);
    
    console.log(`Orçamento diário total: ${totalDailyBudget}`);
    console.log(`Gasto total do mês atual: ${totalSpent}`);
    
    // 6. Retornar os dados calculados
    return {
      meta_daily_budget_current: totalDailyBudget,
      meta_total_spent: totalSpent,
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        effective_status: campaign.effective_status,
        daily_budget: campaign.daily_budget ? campaign.daily_budget / 100 : 0,
        adsets_count: campaign.adsets?.length || 0,
        active_adsets_count: campaign.adsets?.filter(adset => 
          adset.status === 'ACTIVE' && adset.effective_status === 'ACTIVE'
        ).length || 0
      })),
      insights
    };
  } catch (error) {
    console.error('Erro ao processar dados do Meta Ads:', error.message);
    throw error;
  }
};
