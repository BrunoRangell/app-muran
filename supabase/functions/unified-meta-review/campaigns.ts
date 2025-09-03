import { CampaignHealthData } from "./types.ts";

// Função para obter a data atual no timezone brasileiro
function getTodayInBrazil(): string {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (-3 * 3600000));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log(`🇧🇷 [CAMPAIGNS] Data atual no timezone brasileiro: ${result}`);
  return result;
}

// Buscar dados do Meta Ads para campanhas
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number; campaignsDetails: any[] }> {
  try {
    const today = getTodayInBrazil();
    console.log(`🔍 [CAMPAIGNS] Buscando campanhas Meta para conta ${accountId} na data ${today}`);
    
    const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?fields=id,name,effective_status&access_token=${accessToken}`;
    
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    if (!campaignsResponse.ok || campaignsData.error) {
      console.error(`❌ [CAMPAIGNS] Erro ao buscar campanhas:`, campaignsData.error || campaignsResponse.status);
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
    }
    
    if (!campaignsData.data || !Array.isArray(campaignsData.data)) {
      console.log(`⚠️ [CAMPAIGNS] Nenhuma campanha encontrada para conta ${accountId}`);
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
    }
    
    const activeCampaigns = campaignsData.data.filter((campaign: any) => 
      campaign.effective_status === 'ACTIVE'
    );
    
    console.log(`✅ [CAMPAIGNS] ${activeCampaigns.length} campanhas ativas encontradas`);
    
    if (activeCampaigns.length === 0) {
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
    }
    
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&access_token=${accessToken}`;
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    
    if (!insightsResponse.ok || insightsData.error) {
      console.error(`❌ [CAMPAIGNS] Erro ao buscar insights:`, insightsData.error || insightsResponse.status);
      return { cost: 0, impressions: 0, activeCampaigns: activeCampaigns.length, campaignsDetails: [] };
    }
    
    let totalCost = 0;
    let totalImpressions = 0;
    
    if (insightsData.data && Array.isArray(insightsData.data) && insightsData.data.length > 0) {
      const todayInsights = insightsData.data[0];
      totalCost = parseFloat(todayInsights.spend || '0');
      totalImpressions = parseInt(todayInsights.impressions || '0');
      
      console.log(`💰 [CAMPAIGNS] Custo: R$ ${totalCost}, Impressões: ${totalImpressions}`);
    }

    // Buscar dados detalhados de cada campanha
    const campaignsDetails = [];
    for (const campaign of activeCampaigns) {
      try {
        const campaignInsightsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&access_token=${accessToken}`;
        const campaignResponse = await fetch(campaignInsightsUrl);
        const campaignInsights = await campaignResponse.json();
        
        let campaignCost = 0;
        let campaignImpressions = 0;
        
        if (campaignInsights.data && campaignInsights.data.length > 0) {
          campaignCost = parseFloat(campaignInsights.data[0].spend || '0');
          campaignImpressions = parseInt(campaignInsights.data[0].impressions || '0');
        }
        
        campaignsDetails.push({
          id: campaign.id,
          name: campaign.name,
          cost: campaignCost,
          impressions: campaignImpressions,
          status: campaign.effective_status
        });
      } catch (error) {
        console.error(`❌ [CAMPAIGNS] Erro ao buscar insights da campanha ${campaign.id}:`, error);
        campaignsDetails.push({
          id: campaign.id,
          name: campaign.name,
          cost: 0,
          impressions: 0,
          status: campaign.effective_status
        });
      }
    }
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns.length,
      campaignsDetails: campaignsDetails
    };
    
  } catch (error) {
    console.error(`❌ [CAMPAIGNS] Erro para conta ${accountId}:`, error);
    return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
  }
}

// Função para atualizar dados de campaign health
export async function updateCampaignHealth(
  supabase: any, 
  clientId: string, 
  accountId: string, 
  accessToken: string, 
  snapshotDate: string
): Promise<void> {
  const startTime = Date.now();
  console.log(`📊 [CAMPAIGNS] Iniciando atualização de campaign health para cliente ${clientId}`);
  
  try {
    // Buscar dados da conta Meta específica
    const { data: accountData, error: accountError } = await supabase
      .from('client_accounts')
      .select('id, account_id')
      .eq('client_id', clientId)
      .eq('platform', 'meta')
      .eq('status', 'active')
      .single();

    if (accountError || !accountData) {
      console.error(`❌ [CAMPAIGNS] Erro ao buscar dados da conta:`, accountError);
      return;
    }

    // Buscar dados das campanhas Meta
    const campaignData = await fetchMetaActiveCampaigns(accessToken, accountData.account_id);
    
    // Calcular campanhas sem veiculação baseado nos dados detalhados
    const unservedCampaigns = campaignData.campaignsDetails.filter(campaign => 
      campaign.cost === 0 && campaign.impressions === 0
    ).length;

    const healthSnapshot: CampaignHealthData = {
      client_id: clientId,
      account_id: accountData.id,
      snapshot_date: snapshotDate,
      platform: 'meta',
      has_account: true,
      active_campaigns_count: campaignData.activeCampaigns,
      unserved_campaigns_count: unservedCampaigns,
      cost_today: campaignData.cost,
      impressions_today: campaignData.impressions,
      campaigns_detailed: campaignData.campaignsDetails
    };

    // Verificar se já existe registro para hoje
    const { data: existing, error: checkError } = await supabase
      .from('campaign_health')
      .select('id')
      .eq('client_id', clientId)
      .eq('account_id', accountData.id)
      .eq('snapshot_date', snapshotDate)
      .eq('platform', 'meta')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`❌ [CAMPAIGNS] Erro ao verificar registro existente:`, checkError);
      return;
    }

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('campaign_health')
        .update({
          has_account: healthSnapshot.has_account,
          active_campaigns_count: healthSnapshot.active_campaigns_count,
          unserved_campaigns_count: healthSnapshot.unserved_campaigns_count,
          cost_today: healthSnapshot.cost_today,
          impressions_today: healthSnapshot.impressions_today,
          campaigns_detailed: healthSnapshot.campaigns_detailed,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`❌ [CAMPAIGNS] Erro ao atualizar campaign health:`, updateError);
      } else {
        const time = Date.now() - startTime;
        console.log(`✅ [CAMPAIGNS] Campaign health atualizado (${time}ms)`);
      }
    } else {
      // Criar novo registro
      const { error: insertError } = await supabase
        .from('campaign_health')
        .insert(healthSnapshot);

      if (insertError) {
        console.error(`❌ [CAMPAIGNS] Erro ao inserir campaign health:`, insertError);
      } else {
        const time = Date.now() - startTime;
        console.log(`✅ [CAMPAIGNS] Campaign health criado (${time}ms)`);
      }
    }

  } catch (error) {
    const time = Date.now() - startTime;
    console.error(`❌ [CAMPAIGNS] Erro ao atualizar campaign health (${time}ms):`, error);
  }
}