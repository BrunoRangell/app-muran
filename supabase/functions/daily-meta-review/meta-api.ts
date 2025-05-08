
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

interface MetaAdsData {
  totalSpent: number;
  error?: string;
}

/**
 * Busca dados de gastos da API do Meta Ads para uma conta específica
 * @param accountId - ID da conta Meta Ads
 * @param accessToken - Token de acesso da API Meta Ads
 * @returns Objeto com gasto total e possível erro
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
    
    // Fazer requisição para a API
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
      return { totalSpent: 0 };
    }
    
    // Extrair gasto total dos dados
    let totalSpent = 0;
    if (data.data[0].spend !== undefined) {
      totalSpent = parseFloat(data.data[0].spend);
    }
    
    console.log(`Dados obtidos da API Meta Ads com sucesso. Gasto total: ${totalSpent}`);
    
    return { totalSpent };
  } catch (error) {
    console.error("Erro ao buscar dados da API Meta Ads:", error);
    throw error;
  }
}
