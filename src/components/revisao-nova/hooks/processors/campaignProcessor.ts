
import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";

/**
 * Extrai e normaliza o valor de gasto de uma campanha do Meta Ads
 * Prioriza o formato de resposta da API do Graph v20.0
 */
export const extractCampaignSpend = (campaign: SimpleMetaCampaign): number => {
  // Registrar valores brutos para depuração
  console.log(`[campaignProcessor] Processando campanha ${campaign.name} (${campaign.id})`);
  console.log(`- Valor original de spend:`, campaign.spend);
  console.log(`- Insights disponíveis:`, campaign.insights?.data?.[0]?.spend);

  // Verificar primeiro nos insights, que é o formato mais comum na resposta da API do Graph
  if (campaign.insights?.data && campaign.insights.data.length > 0 && campaign.insights.data[0].spend !== undefined) {
    const value = parseFloat(String(campaign.insights.data[0].spend));
    console.log(`- Usando valor de insights.data[0].spend: ${value}`);
    return isNaN(value) ? 0 : value;
  }
  
  // Se não tiver nos insights, verificar no formato direto
  if (typeof campaign.spend === 'number') {
    console.log(`- Usando valor numérico direto: ${campaign.spend}`);
    return campaign.spend;
  } 
  
  if (typeof campaign.spend === 'string') {
    const value = parseFloat(campaign.spend);
    console.log(`- Convertendo string para número: ${value}`);
    return isNaN(value) ? 0 : value;
  } 
  
  // Formatos de objeto como { value: "123.45" }
  if (typeof campaign.spend === 'object' && campaign.spend !== null) {
    const spendObj = campaign.spend as any;
    
    if (spendObj.value !== undefined) {
      const value = parseFloat(String(spendObj.value));
      console.log(`- Extraindo valor de objeto spend.value: ${value}`);
      return isNaN(value) ? 0 : value;
    }
    
    // Tentar outras propriedades comuns
    const possibleProps = ['amount', 'cost', 'total'];
    for (const prop of possibleProps) {
      if (spendObj[prop] !== undefined) {
        const value = parseFloat(String(spendObj[prop]));
        console.log(`- Extraindo valor de objeto spend.${prop}: ${value}`);
        return isNaN(value) ? 0 : value;
      }
    }
  }
  
  console.log(`- Nenhum valor de gasto encontrado, retornando 0`);
  return 0;
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

