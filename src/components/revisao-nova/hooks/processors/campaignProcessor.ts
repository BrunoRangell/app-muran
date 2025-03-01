import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";

export const processCampaigns = (campaigns: any[], insights: any[]): SimpleMetaCampaign[] => {
  if (!campaigns || !insights) return [];

  return campaigns.map(campaign => {
    const campaignInsights = insights.filter(insight => 
      insight.campaign_id === campaign.id
    );

    const totalSpend = campaignInsights.reduce((sum, insight) => {
      const spendValue = parseFloat(insight.spend) || 0;
      console.log(`[campaignProcessor] Spend para ${campaign.name}: ${spendValue}`);
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
    const spendValue = parseFloat(campaign.spend || "0");
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
