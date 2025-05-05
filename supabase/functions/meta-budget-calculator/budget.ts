
import { fetchAdSets } from "./api.ts";

// Função para calcular orçamentos diários
export async function calculateDailyBudgets(
  campaigns: any[], 
  totalSpent: number,
  accessToken: string,
  daysDiff: number
) {
  // Data atual para comparações
  const now = new Date();
  console.log(`Data atual: ${now.toISOString()}`);

  let totalDailyBudget = 0;
  const campaignDetails = [];
  const skippedCampaigns = [];
  const statusCounts: Record<string, number> = {};

  // Processar cada campanha
  for (const campaign of campaigns) {
    // Contabilizar os diferentes status para diagnóstico
    const statusKey = `${campaign.status}:${campaign.effective_status}`;
    statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
    
    // Processar a campanha para cálculo de orçamento
    const result = await processCampaign(campaign, accessToken, now);
    
    if (result.type === 'skipped') {
      skippedCampaigns.push(result.data);
    } else if (result.type === 'campaign') {
      totalDailyBudget += result.budget;
      campaignDetails.push(result.data);
    } else if (result.type === 'adsets') {
      totalDailyBudget += result.budget;
      campaignDetails.push(...result.data);
    }
  }

  console.log(`\nOrçamento diário total calculado: R$ ${totalDailyBudget}`);
  console.log(`Total de itens detalhados: ${campaignDetails.length}`);
  console.log(`Campanhas ignoradas: ${skippedCampaigns.length}`);

  // Ordenar detalhes por tipo e valor
  campaignDetails.sort((a, b) => {
    // Primeiro ordenar por tipo (campanhas primeiro)
    if (a.type !== b.type) {
      return a.type === 'campaign' ? -1 : 1;
    }
    // Se mesmo tipo, ordenar por orçamento (maior primeiro)
    return b.budget - a.budget;
  });

  return {
    totalDailyBudget,
    campaignDetails,
    skippedCampaigns,
    statusCounts
  };
}

// Função para processar uma campanha individual
export async function processCampaign(campaign: any, accessToken: string, now: Date) {
  // Log detalhado para diagnóstico
  console.log(`\nAvaliando campanha: ID=${campaign.id}, Nome="${campaign.name}", Status=${campaign.status}, EffectiveStatus=${campaign.effective_status}`);
  
  // Verificar se a campanha está ativa
  if (campaign.status !== "ACTIVE") {
    console.log(`Campanha ${campaign.id} (${campaign.name}) não está ativa. Status: ${campaign.status}`);
    return {
      type: 'skipped',
      data: {
        id: campaign.id,
        name: campaign.name,
        reason: `Status não ativo: ${campaign.status}`,
        details: { status: campaign.status, effectiveStatus: campaign.effective_status }
      }
    };
  }

  // Verificar effective_status também
  if (campaign.effective_status !== "ACTIVE") {
    console.log(`Campanha ${campaign.id} (${campaign.name}) tem effective_status não ativo: ${campaign.effective_status}`);
    return {
      type: 'skipped',
      data: {
        id: campaign.id,
        name: campaign.name,
        reason: `Effective status não ativo: ${campaign.effective_status}`,
        details: { status: campaign.status, effectiveStatus: campaign.effective_status }
      }
    };
  }

  // Verificar data de término
  if (campaign.end_time) {
    const endTime = new Date(campaign.end_time);
    const isFuture = endTime > now;
    if (!isFuture) {
      console.log(`Campanha ${campaign.id} (${campaign.name}) já terminou em ${endTime.toLocaleDateString('pt-BR')}`);
      return {
        type: 'skipped',
        data: {
          id: campaign.id,
          name: campaign.name,
          reason: `Data de término já passou: ${endTime.toLocaleDateString('pt-BR')}`,
          details: { endTime: campaign.end_time }
        }
      };
    }
  }

  // Verificar se é uma campanha de orçamento por tempo de vida
  const hasLifetimeBudget = campaign.lifetime_budget && parseInt(campaign.lifetime_budget) > 0;
  if (hasLifetimeBudget) {
    console.log(`Campanha ${campaign.id} (${campaign.name}) tem orçamento por tempo de vida: ${parseInt(campaign.lifetime_budget) / 100}`);
    // Não vamos pular, mas registramos para diagnóstico
  }

  // Buscar conjuntos de anúncios para a campanha
  const adsetsResult = await fetchAdSets(campaign.id, accessToken);
  
  if (!adsetsResult.success) {
    return {
      type: 'skipped',
      data: {
        id: campaign.id,
        name: campaign.name,
        reason: "Erro ao buscar conjuntos de anúncios",
        details: {}
      }
    };
  }

  const adsets = adsetsResult.data;
  console.log(`Campanha ${campaign.id} (${campaign.name}) tem ${adsets.length} conjuntos de anúncios totais`);
  
  // Filtrar apenas conjuntos de anúncios ativos
  const activeAdsets = filterActiveAdsets(adsets, now);
  console.log(`Campanha ${campaign.id} (${campaign.name}) tem ${activeAdsets.length} conjuntos de anúncios ativos`);

  // Se a campanha tem orçamento diário e pelo menos um conjunto de anúncios ativo
  if (campaign.daily_budget && parseInt(campaign.daily_budget) > 0 && activeAdsets.length > 0) {
    const campaignBudget = parseInt(campaign.daily_budget) / 100; // Converte de centavos para reais
    console.log(`Adicionando orçamento da campanha ${campaign.id} (${campaign.name}): R$ ${campaignBudget}`);
    
    return {
      type: 'campaign',
      budget: campaignBudget,
      data: {
        id: campaign.id,
        name: campaign.name,
        budget: campaignBudget,
        status: campaign.status,
        effectiveStatus: campaign.effective_status,
        type: 'campaign'
      }
    };
  } 
  // Se a campanha não tem orçamento diário ou tem zero, soma o orçamento dos conjuntos de anúncios ativos
  else if ((!campaign.daily_budget || parseInt(campaign.daily_budget) === 0) && activeAdsets.length > 0) {
    let adsetBudgetSum = 0;
    const adsetDetails = [];
    
    // Iterar pelos adsets ativos e somar seus orçamentos
    for (const adset of activeAdsets) {
      if (adset.daily_budget && parseInt(adset.daily_budget) > 0) {
        const adsetBudget = parseInt(adset.daily_budget) / 100; // Converte de centavos para reais
        adsetBudgetSum += adsetBudget;
        console.log(`Adicionando orçamento do conjunto de anúncios ${adset.id} (${adset.name}): R$ ${adsetBudget}`);
        
        // Adicionar aos detalhes
        adsetDetails.push({
          id: adset.id,
          name: adset.name,
          budget: adsetBudget,
          status: adset.status,
          effectiveStatus: adset.effective_status,
          type: 'adset',
          parentName: campaign.name,
          parentId: campaign.id
        });
      } else if (hasLifetimeBudget) {
        console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) sem orçamento diário e pertence a campanha com orçamento por tempo de vida`);
      }
    }
    
    // Adicionar a soma dos orçamentos dos adsets ao total
    if (adsetBudgetSum > 0) {
      console.log(`Campanha ${campaign.id} (${campaign.name}): Total de orçamento dos adsets: R$ ${adsetBudgetSum}`);
      return {
        type: 'adsets',
        budget: adsetBudgetSum,
        data: adsetDetails
      };
    }
  }

  // Registrar campanhas sem orçamento e sem adsets ativos para diagnóstico
  const reason = !campaign.daily_budget && activeAdsets.length === 0 
    ? "Sem orçamento diário e sem conjuntos de anúncios ativos" 
    : !campaign.daily_budget 
      ? "Sem orçamento diário definido" 
      : "Sem conjuntos de anúncios ativos";
  
  console.log(`Campanha ${campaign.id} (${campaign.name}) - ${reason}`);
  
  return {
    type: 'skipped',
    data: {
      id: campaign.id,
      name: campaign.name,
      reason: reason,
      details: { 
        dailyBudget: campaign.daily_budget ? parseInt(campaign.daily_budget) / 100 : 0,
        activeAdsets: activeAdsets.length,
        totalAdsets: adsets.length
      }
    }
  };
}

// Função para filtrar adsets ativos
function filterActiveAdsets(adsets: any[], now: Date) {
  return adsets.filter(adset => {
    // Verificar status
    if (adset.status !== "ACTIVE") {
      console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) não está ativo. Status: ${adset.status}`);
      return false;
    }
    
    // Verificar effective_status
    if (adset.effective_status !== "ACTIVE") {
      console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) tem effective_status não ativo: ${adset.effective_status}`);
      return false;
    }
    
    // Verificar data de término
    if (adset.end_time) {
      const endTime = new Date(adset.end_time);
      const isFuture = endTime > now;
      if (!isFuture) {
        console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) já terminou em ${endTime.toLocaleDateString('pt-BR')}`);
        return false;
      }
    }
    
    return true;
  });
}
