import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";
import { DateTime } from "luxon";

/**
 * Extrai o spend considerando o período do mês atual
 */
export const extractCampaignSpend = (campaign: SimpleMetaCampaign): number => {
  if (!campaign) return 0;

  // Verificar se os insights são do mês atual
  const today = DateTime.now().setZone("America/Sao_Paulo");
  const monthStart = today.startOf("month").toISODate();
  const monthEnd = today.endOf("month").toISODate();

  const validInsights = campaign.insights?.data?.filter(insight => 
    insight.date_start === monthStart && 
    insight.date_stop === monthEnd
  );

  // Priorizar o spend do mês atual
  if (validInsights?.length > 0) {
    const spend = parseFloat(validInsights[0].spend || "0");
    console.log(`[campaignProcessor] Spend válido encontrado para ${campaign.name}:`, spend);
    return spend;
  }

  // Fallback para spend direto (se aplicável)
  return parseFloat(campaign.spend || "0");
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
    const spendValue = extractCampaignSpend(campaign);
    
    // Retorna o objeto original com o spend normalizado como número
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
