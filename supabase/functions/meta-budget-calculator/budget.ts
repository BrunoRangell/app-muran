import { fetchAdSets } from "./api.ts";

// Função principal para calcular orçamentos diários
export async function calculateDailyBudgets(
  campaigns: any[], 
  totalSpent: number,
  accessToken: string,
  daysDiff: number
) {
  console.log(`🧮 Iniciando cálculo de orçamentos diários para ${campaigns.length} campanhas`);
  console.log(`📊 Parâmetros: Total gasto: ${totalSpent}, Dias no período: ${daysDiff}`);
  
  let totalDailyBudget = 0;
  const campaignDetails: any[] = [];
  const skippedCampaigns: any[] = [];
  const statusCounts = {
    active: 0,
    paused: 0,
    ended: 0,
    other: 0
  };

  for (const campaign of campaigns) {
    const result = await processCampaign(campaign, accessToken, new Date());
    
    if (result.type === 'skipped') {
      skippedCampaigns.push(result.data);
      statusCounts[result.data.reason as keyof typeof statusCounts] = 
        (statusCounts[result.data.reason as keyof typeof statusCounts] || 0) + 1;
    } else {
      totalDailyBudget += result.data.dailyBudget;
      campaignDetails.push(result.data);
      statusCounts.active++;
    }
  }

  console.log(`✅ Cálculo concluído:`);
  console.log(`   - Orçamento diário total: ${totalDailyBudget}`);
  console.log(`   - Campanhas ativas: ${statusCounts.active}`);
  console.log(`   - Campanhas pausadas: ${statusCounts.paused}`);
  console.log(`   - Campanhas finalizadas: ${statusCounts.ended}`);
  console.log(`   - Campanhas ignoradas: ${skippedCampaigns.length}`);

  return {
    totalDailyBudget,
    campaignDetails,
    skippedCampaigns,
    statusCounts
  };
}

// Função para processar uma campanha individual
export async function processCampaign(campaign: any, accessToken: string, now: Date) {
  const campaignId = campaign.id;
  const campaignName = campaign.name;
  
  console.log(`🔍 Processando campanha: ${campaignName} (${campaignId})`);
  console.log(`   Status: ${campaign.status}, Effective Status: ${campaign.effective_status}`);
  
  // Verificar se a campanha está ativa
  if (campaign.status !== 'ACTIVE') {
    console.log(`⏸️ Campanha ${campaignName} pulada: status não é ACTIVE (${campaign.status})`);
    return {
      type: 'skipped',
      data: {
        campaignId,
        campaignName,
        reason: 'paused',
        details: `Status: ${campaign.status}`
      }
    };
  }

  // Verificar effective_status
  if (campaign.effective_status && !['ACTIVE', 'LEARNING', 'LEARNING_LIMITED'].includes(campaign.effective_status)) {
    console.log(`⏸️ Campanha ${campaignName} pulada: effective_status inativo (${campaign.effective_status})`);
    return {
      type: 'skipped',
      data: {
        campaignId,
        campaignName,
        reason: 'paused',
        details: `Effective Status: ${campaign.effective_status}`
      }
    };
  }

  // Verificar se a campanha já terminou
  if (campaign.stop_time) {
    const endDate = new Date(campaign.stop_time);
    if (endDate < now) {
      console.log(`🏁 Campanha ${campaignName} pulada: já terminou em ${campaign.stop_time}`);
      return {
        type: 'skipped',
        data: {
          campaignId,
          campaignName,
          reason: 'ended',
          details: `Terminou em: ${campaign.stop_time}`
        }
      };
    }
  }

  // Verificar se existe orçamento diário na campanha
  if (campaign.daily_budget && parseFloat(campaign.daily_budget) > 0) {
    const dailyBudget = parseFloat(campaign.daily_budget) / 100; // Meta API retorna em centavos
    console.log(`💰 Campanha ${campaignName}: orçamento diário da campanha = ${dailyBudget}`);
    
    return {
      type: 'campaign',
      data: {
        campaignId,
        campaignName,
        dailyBudget,
        budgetSource: 'campaign',
        adSetsCount: 0
      }
    };
  }

  // Se não há orçamento diário na campanha, buscar nos adsets
  console.log(`🔍 Buscando adsets para campanha ${campaignName}...`);
  const adSetsResult = await fetchAdSets(campaignId, accessToken);
  
  if (!adSetsResult.success) {
    console.log(`❌ Erro ao buscar adsets para campanha ${campaignName}`);
    return {
      type: 'skipped',
      data: {
        campaignId,
        campaignName,
        reason: 'other',
        details: 'Erro ao buscar adsets'
      }
    };
  }

  const activeAdSets = filterActiveAdsets(adSetsResult.data, now);
  
  if (activeAdSets.length === 0) {
    console.log(`🚫 Campanha ${campaignName}: nenhum adset ativo encontrado`);
    return {
      type: 'skipped',
      data: {
        campaignId,
        campaignName,
        reason: 'other',
        details: 'Nenhum adset ativo'
      }
    };
  }

  // Calcular orçamento total dos adsets ativos
  let totalAdSetBudget = 0;
  activeAdSets.forEach(adset => {
    if (adset.daily_budget) {
      totalAdSetBudget += parseFloat(adset.daily_budget) / 100; // Meta API retorna em centavos
    }
  });

  console.log(`💰 Campanha ${campaignName}: orçamento total dos adsets = ${totalAdSetBudget} (${activeAdSets.length} adsets ativos)`);

  return {
    type: 'adsets',
    data: {
      campaignId,
      campaignName,
      dailyBudget: totalAdSetBudget,
      budgetSource: 'adsets',
      adSetsCount: activeAdSets.length
    }
  };
}

// Função para filtrar adsets ativos
export function filterActiveAdsets(adsets: any[], now: Date) {
  return adsets.filter(adset => {
    // Verificar status
    if (adset.status !== 'ACTIVE') {
      return false;
    }

    // Verificar effective_status
    if (adset.effective_status && !['ACTIVE', 'LEARNING', 'LEARNING_LIMITED'].includes(adset.effective_status)) {
      return false;
    }

    // Verificar se o adset já terminou
    if (adset.end_time) {
      const endDate = new Date(adset.end_time);
      if (endDate < now) {
        return false;
      }
    }

    return true;
  });
}