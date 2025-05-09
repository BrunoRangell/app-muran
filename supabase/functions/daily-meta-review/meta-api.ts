
// Tipos de dados para API da Meta Ads
interface MetaAdsApiResponse {
  data?: {
    spend?: number;
  }[];
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
}

interface MetaAdsCampaignResponse {
  data?: {
    id: string;
    name: string;
    daily_budget?: string;
    status: string;
  }[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
}

interface MetaAdsAdSetResponse {
  data?: {
    id: string;
    name: string;
    daily_budget?: string;
    status: string;
    campaign: {
      id: string;
    };
  }[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
}

interface MetaAdsData {
  totalSpent: number;
  dailyBudgetCurrent: number;
  error?: string;
}

/**
 * Busca dados de gastos e orçamentos da API do Meta Ads para uma conta específica
 * @param accountId - ID da conta Meta Ads
 * @param accessToken - Token de acesso da API Meta Ads
 * @returns Objeto com gasto total, orçamento diário atual e possível erro
 */
export async function fetchMetaAdsData(accountId: string, accessToken: string): Promise<MetaAdsData> {
  try {
    console.log(`Inicializando busca de dados da API Meta Ads para conta ${accountId}`);
    
    // Validar parâmetros de entrada
    if (!accountId) {
      throw new Error("ID da conta Meta Ads é obrigatório");
    }
    
    if (!accessToken) {
      throw new Error("Token de acesso Meta Ads é obrigatório");
    }
    
    // Data atual e primeiro dia do mês para relatório
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Formatar datas no formato YYYY-MM-DD
    const endDate = today.toISOString().split('T')[0];
    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    
    console.log(`Buscando dados do período: ${startDate} até ${endDate}`);
    
    // URL da API de Insights do Meta Ads
    const apiUrl = `https://graph.facebook.com/v17.0/act_${accountId}/insights`;
    
    // Construir URL com parâmetros necessários
    const url = new URL(apiUrl);
    url.searchParams.append('access_token', accessToken);
    url.searchParams.append('fields', 'spend');
    url.searchParams.append('time_range', JSON.stringify({ since: startDate, until: endDate }));
    url.searchParams.append('level', 'account');
    
    console.log(`Enviando requisição para API Meta Ads: ${url.toString().replace(accessToken, "***TOKEN_OCULTO***")}`);
    
    // Fazer requisição para a API de insights
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Verificar resposta HTTP
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro HTTP na API Meta Ads: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Erro ${response.status} ao buscar dados da Meta Ads: ${errorText}`);
    }
    
    // Parsear resposta JSON
    const data: MetaAdsApiResponse = await response.json();
    
    // Verificar se há erro no retorno da API
    if (data.error) {
      console.error("Erro na resposta da API Meta Ads:", data.error);
      throw new Error(`Erro na API Meta Ads: ${data.error.message || 'Erro desconhecido'}`);
    }
    
    // Verificar se há dados no retorno da API
    if (!data.data || data.data.length === 0) {
      console.warn("Resposta da API Meta Ads não contém dados");
      return { totalSpent: 0, dailyBudgetCurrent: 0 };
    }
    
    // Extrair gasto total dos dados
    let totalSpent = 0;
    if (data.data[0].spend !== undefined) {
      totalSpent = parseFloat(data.data[0].spend);
    }
    
    // Agora, vamos buscar os orçamentos das campanhas ativas
    const dailyBudgetCurrent = await fetchActiveCampaignsBudgets(accountId, accessToken);
    
    console.log(`Dados obtidos da API Meta Ads com sucesso. Gasto total: ${totalSpent}, Orçamento diário atual: ${dailyBudgetCurrent}`);
    
    return { 
      totalSpent,
      dailyBudgetCurrent
    };
  } catch (error) {
    console.error("Erro ao buscar dados da API Meta Ads:", error);
    throw error;
  }
}

/**
 * Busca orçamentos diários de campanhas ativas para uma conta Meta Ads
 * @param accountId - ID da conta Meta Ads
 * @param accessToken - Token de acesso da API Meta Ads
 * @returns Soma dos orçamentos diários de campanhas e conjuntos de anúncios ativos
 */
async function fetchActiveCampaignsBudgets(accountId: string, accessToken: string): Promise<number> {
  try {
    console.log(`Buscando orçamentos de campanhas ativas para conta ${accountId}`);
    
    // URL da API de Campanhas do Meta Ads
    const campaignsApiUrl = `https://graph.facebook.com/v17.0/act_${accountId}/campaigns`;
    
    // Construir URL com parâmetros necessários
    const campaignsUrl = new URL(campaignsApiUrl);
    campaignsUrl.searchParams.append('access_token', accessToken);
    campaignsUrl.searchParams.append('fields', 'name,daily_budget,status');
    campaignsUrl.searchParams.append('limit', '1000');
    campaignsUrl.searchParams.append('effective_status', '["ACTIVE"]');
    
    // Fazer requisição para a API de campanhas
    const campaignsResponse = await fetch(campaignsUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!campaignsResponse.ok) {
      console.warn(`Erro ao buscar campanhas: ${campaignsResponse.status} ${campaignsResponse.statusText}`);
      return 0; // Retornar 0 como fallback
    }
    
    // Parsear resposta JSON
    const campaignsData: MetaAdsCampaignResponse = await campaignsResponse.json();
    
    // Verificar se há erro ou dados ausentes
    if (campaignsData.error || !campaignsData.data || campaignsData.data.length === 0) {
      console.warn("Nenhuma campanha ativa encontrada ou erro nos dados de campanhas");
      return 0;
    }

    console.log(`Encontradas ${campaignsData.data.length} campanhas ativas`);
    
    let totalDailyBudget = 0;
    const campaignsWithoutBudget: string[] = [];
    
    // Somar orçamentos das campanhas
    for (const campaign of campaignsData.data) {
      if (campaign.daily_budget) {
        // Se a campanha tem orçamento próprio, adicionar à soma
        const campaignBudget = parseFloat(campaign.daily_budget) / 100; // Meta retorna em centavos
        totalDailyBudget += campaignBudget;
        console.log(`Campanha "${campaign.name}" com orçamento diário: ${campaignBudget}`);
      } else {
        // Registrar campanhas sem orçamento para buscar conjuntos de anúncios depois
        campaignsWithoutBudget.push(campaign.id);
      }
    }
    
    // Se há campanhas sem orçamento definido, buscar os conjuntos de anúncios
    if (campaignsWithoutBudget.length > 0) {
      console.log(`Buscando orçamentos de conjuntos de anúncios para ${campaignsWithoutBudget.length} campanhas sem orçamento definido`);
      
      // URL da API de Conjuntos de Anúncios
      const adSetsApiUrl = `https://graph.facebook.com/v17.0/act_${accountId}/adsets`;
      
      // Construir URL com parâmetros necessários
      const adSetsUrl = new URL(adSetsApiUrl);
      adSetsUrl.searchParams.append('access_token', accessToken);
      adSetsUrl.searchParams.append('fields', 'name,daily_budget,status,campaign{id}');
      adSetsUrl.searchParams.append('limit', '1000');
      adSetsUrl.searchParams.append('effective_status', '["ACTIVE"]');
      
      // Fazer requisição para a API de conjuntos de anúncios
      const adSetsResponse = await fetch(adSetsUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!adSetsResponse.ok) {
        console.warn(`Erro ao buscar conjuntos de anúncios: ${adSetsResponse.status} ${adSetsResponse.statusText}`);
      } else {
        // Parsear resposta JSON
        const adSetsData: MetaAdsAdSetResponse = await adSetsResponse.json();
        
        // Verificar se há dados
        if (adSetsData.data && adSetsData.data.length > 0) {
          console.log(`Encontrados ${adSetsData.data.length} conjuntos de anúncios ativos`);
          
          // Filtrar apenas conjuntos de anúncios de campanhas sem orçamento próprio
          const relevantAdSets = adSetsData.data.filter(adSet => 
            adSet.campaign && campaignsWithoutBudget.includes(adSet.campaign.id)
          );
          
          console.log(`${relevantAdSets.length} conjuntos de anúncios pertencem a campanhas sem orçamento definido`);
          
          // Somar orçamentos dos conjuntos de anúncios
          for (const adSet of relevantAdSets) {
            if (adSet.daily_budget) {
              const adSetBudget = parseFloat(adSet.daily_budget) / 100; // Meta retorna em centavos
              totalDailyBudget += adSetBudget;
              console.log(`Conjunto de anúncios "${adSet.name}" com orçamento diário: ${adSetBudget}`);
            }
          }
        }
      }
    }
    
    console.log(`Orçamento diário total das campanhas e conjuntos de anúncios ativos: ${totalDailyBudget}`);
    return totalDailyBudget;
  } catch (error) {
    console.error("Erro ao buscar orçamentos das campanhas:", error);
    return 0; // Retornar 0 como fallback em caso de erro
  }
}
