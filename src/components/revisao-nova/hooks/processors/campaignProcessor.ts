import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";

/**
 * Extrai e normaliza o valor de gasto de uma campanha do Meta Ads
 * Prioriza o formato de resposta da API do Graph v20.0
 */
export const extractCampaignSpend = (campaign: SimpleMetaCampaign): number => {
  if (!campaign || typeof campaign !== 'object') {
    console.log(`[campaignProcessor] Campanha inválida ou mal formatada`);
    return 0;
  }

  console.log(`[campaignProcessor] Processando campanha ${campaign.name} (${campaign.id})`);
  console.log(`- Valor original de spend:`, campaign.spend);
  console.log(`- Insights disponíveis:`, campaign.insights?.data?.[0]?.spend);

  // Verificar primeiro nos insights, que é o formato mais comum na resposta da API do Graph
  if (campaign.insights && Array.isArray(campaign.insights.data)) {
    const firstInsight = campaign.insights.data[0];
    if (firstInsight && typeof firstInsight.spend !== 'undefined') {
      const value = parseSpendValue(firstInsight.spend);
      console.log(`- Usando valor de insights.data[0].spend: ${value}`);
      return value;
    }
  }
  
  // Se não tiver nos insights, verificar no formato direto
  if (typeof campaign.spend !== 'undefined') {
    const value = parseSpendValue(campaign.spend);
    console.log(`- Usando valor direto de spend: ${value}`);
    return value;
  }
  
  // Formatos de objeto como { value: "123.45" }
  if (typeof campaign.spend === 'object' && campaign.spend !== null) {
    const spendObj = campaign.spend as any;
    
    if (spendObj.value !== undefined) {
      const value = parseSpendValue(spendObj.value);
      console.log(`- Extraindo valor de objeto spend.value: ${value}`);
      return value;
    }
    
    // Tentar outras propriedades comuns
    const possibleProps = ['amount', 'cost', 'total'];
    for (const prop of possibleProps) {
      if (spendObj[prop] !== undefined) {
        const value = parseSpendValue(spendObj[prop]);
        console.log(`- Extraindo valor de objeto spend.${prop}: ${value}`);
        return value;
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

/**
 * Função auxiliar para converter valores monetários em números
 */
const parseSpendValue = (value: any): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    // Remove caracteres não numéricos (ex: "R$ 39,52" -> "39.52")
    const numericValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parsedValue = parseFloat(numericValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  return 0;
};
