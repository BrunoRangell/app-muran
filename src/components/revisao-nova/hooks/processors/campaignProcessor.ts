
import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";

/**
 * Processa as campanhas combinando com os insights para obter os gastos corretos
 * @param campaigns Campanhas obtidas da API do Meta Ads
 * @param insights Insights obtidos da API do Meta Ads (endpoint separado)
 * @returns Campanhas com os dados de gasto incorporados
 */
export const processCampaigns = (campaigns: any[], insights: any[]): SimpleMetaCampaign[] => {
  if (!campaigns || !insights) return [];

  // Agrupar insights por ID de campanha para facilitar a busca
  const insightsByCampaignId = insights.reduce((acc: Record<string, any[]>, insight) => {
    const campaignId = insight.campaign_id;
    if (!acc[campaignId]) {
      acc[campaignId] = [];
    }
    acc[campaignId].push(insight);
    return acc;
  }, {});

  return campaigns.map(campaign => {
    // Buscar todos os insights desta campanha
    const campaignInsights = insightsByCampaignId[campaign.id] || [];
    
    // Calcular o gasto total somando todos os insights
    const totalSpend = campaignInsights.reduce((sum, insight) => {
      const spendValue = parseFloat(insight.spend || "0") || 0;
      console.log(`[campaignProcessor] Gasto para ${campaign.name}: ${spendValue}`);
      return sum + spendValue;
    }, 0);

    console.log(`[campaignProcessor] Total da campanha ${campaign.name}: ${totalSpend}`);
    return {
      ...campaign,
      spend: totalSpend
    };
  });
};

/**
 * Normaliza uma lista de campanhas do Meta Ads, garantindo que todos os valores de gasto
 * sejam números válidos e preservando os dados originais
 */
export const normalizeCampaigns = (campaigns: SimpleMetaCampaign[]): SimpleMetaCampaign[] => {
  if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
    console.log("[campaignProcessor] Lista de campanhas vazia ou inválida");
    return [];
  }

  console.log(`[campaignProcessor] Normalizando ${campaigns.length} campanhas`);
  
  return campaigns.map(campaign => {
    const spendValue = typeof campaign.spend === 'number' ? campaign.spend : 
                       parseFloat(campaign.spend as string || "0") || 0;
    return {
      ...campaign,
      spend: spendValue
    };
  });
};

/**
 * Calcula o gasto total a partir das campanhas normalizadas
 */
export const calculateTotalSpend = (campaigns: SimpleMetaCampaign[]): number => {
  if (!campaigns || campaigns.length === 0) return 0;
  
  const total = campaigns.reduce((sum, campaign) => {
    // Garantir que estamos somando apenas valores numéricos
    const spend = typeof campaign.spend === 'number' ? campaign.spend : 0;
    return sum + spend;
  }, 0);
  
  console.log(`[campaignProcessor] Total calculado das campanhas: ${total}`);
  return total;
};
