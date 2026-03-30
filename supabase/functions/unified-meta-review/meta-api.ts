// Funções para interagir com a Meta Graph API

/**
 * Extrai o saldo numérico a partir de uma string exibida pela API Meta Ads.
 * Exemplo de entrada: "Saldo disponível (R$310,29 BRL)".
 * Se não for possível extrair o valor e houver spendCap, retorna spendCap - amountSpent.
 * Os valores de spendCap e amountSpent devem estar em reais.
 * Caso contrário, retorna null indicando saldo indisponível.
 */
function parseMetaBalance(
  displayString?: string | null,
  spendCap?: number | string | null,
  amountSpent?: number | string | null
): number | null {
  if (displayString) {
    const match = displayString.match(/R\$\s*([\d.,]+)/);
    if (match && match[1]) {
      const numeric = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
      if (!isNaN(numeric)) {
        return numeric;
      }
    }
  }

  if (spendCap && Number(spendCap) > 0) {
    const spent =
      amountSpent !== undefined && amountSpent !== null
        ? Number(amountSpent)
        : 0;
    return Number(spendCap) - spent;
  }

  return null;
}

// Função para buscar conjuntos de anúncios de uma campanha
export async function fetchAdSets(campaignId: string, accessToken: string, campaignName: string = "") {
  const startTime = Date.now();
  console.log(`🔍 [META-API] Iniciando busca de adsets para campanha ${campaignId} (${campaignName})`);
  
  try {
    const adsetsUrl = `https://graph.facebook.com/v22.0/${campaignId}/adsets?fields=id,name,daily_budget,status,effective_status,end_time&access_token=${accessToken}&limit=1000`;
    console.log(`📞 [META-API] Chamando Meta API para campanha ${campaignId}`);
    
    const response = await fetch(adsetsUrl);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [META-API] ERRO na API para campanha ${campaignId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        campaignName,
        responseTime: `${responseTime}ms`
      });
      return [];
    }

    const data = await response.json();
    const adsets = data.data || [];
    
    console.log(`✅ [META-API] Sucesso campanha ${campaignId}:`, {
      campanhaName: campaignName,
      totalAdsets: adsets.length,
      responseTime: `${responseTime}ms`,
      adsetNames: adsets.slice(0, 3).map(a => a.name) // Primeiros 3 nomes
    });
    
    return adsets;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [META-API] ERRO EXCEPTION campanha ${campaignId}:`, {
      error: error.message,
      stack: error.stack,
      campaignName,
      responseTime: `${responseTime}ms`
    });
    return [];
  }
}

// Função para filtrar adsets ativos
export function filterActiveAdsets(adsets: any[], now: Date, campaignId: string = "") {
  const startTime = Date.now();
  console.log(`🔍 [META-API] Iniciando filtro de adsets para campanha ${campaignId}, total: ${adsets.length}`);
  
  const activeAdsets = adsets.filter(adset => {
    // Verificar status
    if (adset.status !== "ACTIVE") {
      console.log(`[META-API] Adset ${adset.id} (${adset.name}) não ativo. Status: ${adset.status}`);
      return false;
    }
    
    // Verificar effective_status
    if (adset.effective_status !== "ACTIVE") {
      console.log(`[META-API] Adset ${adset.id} (${adset.name}) effective_status: ${adset.effective_status}`);
      return false;
    }
    
    // Verificar data de término
    if (adset.end_time) {
      const endTime = new Date(adset.end_time);
      const isFuture = endTime > now;
      if (!isFuture) {
        console.log(`[META-API] Adset ${adset.id} (${adset.name}) expirado em ${endTime.toLocaleDateString('pt-BR')}`);
        return false;
      }
    }
    
    return true;
  });
  
  const filterTime = Date.now() - startTime;
  console.log(`✅ [META-API] Filtro concluído campanha ${campaignId}:`, {
    totalOriginal: adsets.length,
    totalAtivos: activeAdsets.length,
    filterTime: `${filterTime}ms`,
    activeAdsetBudgets: activeAdsets.map(a => ({ name: a.name, budget: a.daily_budget }))
  });
  
  return activeAdsets;
}

// Função para buscar atividades da conta Meta (período personalizável) com paginação
async function fetchAccountActivities(
  accountId: string, 
  accessToken: string, 
  sinceDate?: Date, 
  untilDate?: Date
) {
  const startTime = Date.now();
  console.log(`🚀 [META-ACTIVITIES] === INICIANDO BUSCA DE ATIVIDADES ===`);
  console.log(`📋 [META-ACTIVITIES] Parâmetros de entrada: {
  accountId: ${accountId},
  accessTokenPresent: ${!!accessToken},
  accessTokenLength: ${accessToken?.length || 0},
  sinceDate: ${sinceDate?.toISOString() || 'não especificado'},
  untilDate: ${untilDate?.toISOString() || 'não especificado'}
}`);

  // Se não fornecido, usar últimos 60 dias
  const since = sinceDate 
    ? sinceDate.toISOString().split('T')[0]
    : new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const until = untilDate 
    ? untilDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  
  console.log(`🔍 [META-ACTIVITIES] Período calculado: ${since} até ${until}`);
  console.log(`📡 [META-ACTIVITIES] Preparando requisição para Meta API...`);
  
  try {
    let allActivities = [];
    let nextPageCursor = null;
    let pageCount = 0;
    
    do {
      pageCount++;
      
      // Incluir TODOS os campos conforme exemplo do usuário com paginação
      let activitiesUrl = `https://graph.facebook.com/v22.0/act_${accountId}/activities?since=${since}&until=${until}&fields=event_type,translated_event_type,event_time,date_time_in_timezone,extra_data,object_type,object_name,actor_name&access_token=${accessToken}&limit=100`;
      
      if (nextPageCursor) {
        activitiesUrl += `&after=${nextPageCursor}`;
      }
      
      console.log(`📄 [META-ACTIVITIES] === PÁGINA ${pageCount} ===`);
      console.log(`🔗 [META-ACTIVITIES] URL: ${activitiesUrl.replace(accessToken, '***TOKEN***')}`);
      
      // Aumentar timeout para 15 segundos por página
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`⏰ [META-ACTIVITIES] TIMEOUT de 15s atingido na página ${pageCount} para conta ${accountId}`);
        controller.abort();
      }, 15000);
      
      console.log(`📡 [META-ACTIVITIES] Fazendo requisição HTTP...`);
      const response = await fetch(activitiesUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Muran-System/1.0'
        }
      });
      clearTimeout(timeoutId);
      
      console.log(`✅ [META-ACTIVITIES] Resposta HTTP recebida: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`❌ [META-ACTIVITIES] === ERRO HTTP ===`);
        console.error(`❌ [META-ACTIVITIES] Status: ${response.status} ${response.statusText}`);
        
        const errorText = await response.text();
        console.error(`❌ [META-ACTIVITIES] Resposta completa:`, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error(`❌ [META-ACTIVITIES] Erro Meta parseado:`, {
            code: errorData.error?.code,
            message: errorData.error?.message,
            type: errorData.error?.type,
            fbtrace_id: errorData.error?.fbtrace_id,
            error_user_title: errorData.error?.error_user_title,
            error_user_msg: errorData.error?.error_user_msg
          });
        } catch (parseError) {
          console.error(`❌ [META-ACTIVITIES] Não foi possível parsear erro:`, parseError.message);
        }
        
        throw new Error(`Meta Activities API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const data = await response.json();
      const pageActivities = data.data || [];
      
      // Validar estrutura das activities
      if (!Array.isArray(pageActivities)) {
        console.error(`❌ [META-ACTIVITIES] Resposta inválida para conta ${accountId}, página ${pageCount}:`, data);
        throw new Error('Invalid activities response structure');
      }
      
      allActivities = allActivities.concat(pageActivities);
      
      console.log(`📊 [META-ACTIVITIES] Página ${pageCount}: ${pageActivities.length} activities obtidas (total acumulado: ${allActivities.length})`);
      
      // Verificar se há próxima página
      nextPageCursor = data.paging?.cursors?.after || null;
      
      // Log de funding events em cada página
      const fundingEventsInPage = pageActivities.filter(activity => activity.event_type === 'funding_event_successful');
      if (fundingEventsInPage.length > 0) {
        console.log(`💰 [META-ACTIVITIES] Página ${pageCount}: ${fundingEventsInPage.length} funding events encontrados`);
      }
      
      // Limitar a 10 páginas para evitar loops infinitos
      if (pageCount >= 10) {
        console.log(`⚠️ [META-ACTIVITIES] Limite de 10 páginas atingido para conta ${accountId}`);
        break;
      }
      
    } while (nextPageCursor);
    
    const responseTime = Date.now() - startTime;
    
    // Log final detalhado
    console.log(`📊 [META-ACTIVITIES] Busca completa: ${allActivities.length} activities total em ${pageCount} páginas`);
    
    if (allActivities.length > 0) {
      // Mostrar primeiras 3 activities para debug
      console.log(`📋 [META-ACTIVITIES] Primeiras 3 activities:`, JSON.stringify(allActivities.slice(0, 3), null, 2));
      
      // Contar e mostrar funding_event_successful especificamente
      const fundingEvents = allActivities.filter(activity => activity.event_type === 'funding_event_successful');
      console.log(`💰 [META-ACTIVITIES] Total de funding events encontrados: ${fundingEvents.length}`);
      
      if (fundingEvents.length > 0) {
        console.log(`💰 [META-ACTIVITIES] Primeiro funding event:`, JSON.stringify(fundingEvents[0], null, 2));
      }
      
      // Mostrar tipos de eventos únicos
      const uniqueEventTypes = [...new Set(allActivities.map(a => a.event_type))];
      console.log(`📋 [META-ACTIVITIES] Tipos de eventos encontrados:`, uniqueEventTypes);
    }
    
    console.log(`✅ [META-ACTIVITIES] Retornando ${allActivities.length} activities (paginação completa) em ${responseTime}ms`);
    
    return allActivities;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [META-ACTIVITIES] === ERRO CRÍTICO (${responseTime}ms) ===`);
    console.error(`❌ [META-ACTIVITIES] Detalhes do erro:`, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      accountId,
      accessTokenPresent: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      isAbortError: error.name === 'AbortError',
      isNetworkError: error.message?.includes('fetch'),
      responseTime: `${responseTime}ms`
    });
    
    // Log específico para diferentes tipos de erro
    if (error.name === 'AbortError') {
      console.error(`⏰ [META-ACTIVITIES] TIMEOUT detectado após ${responseTime}ms`);
    } else if (error.message?.includes('fetch')) {
      console.error(`🌐 [META-ACTIVITIES] ERRO DE REDE detectado`);
    } else if (error.message?.includes('401') || error.message?.includes('403')) {
      console.error(`🔐 [META-ACTIVITIES] ERRO DE PERMISSÃO/TOKEN detectado`);
    } else {
      console.error(`🔴 [META-ACTIVITIES] ERRO DESCONHECIDO detectado`);
    }
    
    // Re-throw o erro para que seja capturado no fetchMetaBalance
    throw error;
  }
}

// Função para fazer parse do extra_data JSON
function parseExtraData(extraDataString: string) {
  try {
    if (!extraDataString || typeof extraDataString !== 'string') {
      console.error(`❌ [META-ACTIVITIES] extra_data inválido:`, { extraDataString });
      return null;
    }
    
    const data = JSON.parse(extraDataString);
    return data;
  } catch (error) {
    console.error(`❌ [META-ACTIVITIES] Erro ao fazer parse do extra_data:`, {
      extraData: extraDataString?.substring(0, 100) + '...',
      error: error.message
    });
    return null;
  }
}

// Função para calcular saldo restante baseado nas activities
function calculateBalanceFromActivities(activities: any[]) {
  console.log(`💰 [META-ACTIVITIES] Iniciando cálculo de saldo com ${activities.length} activities`);
  
  try {
    // Validar entrada
    if (!Array.isArray(activities) || activities.length === 0) {
      console.log(`⚠️ [META-ACTIVITIES] Activities inválidas ou vazias`);
      return null;
    }
    
    // Ordenar activities por data (mais recente primeiro)
    const sortedActivities = activities.sort((a, b) => {
      try {
        const dateA = new Date(a.event_time).getTime();
        const dateB = new Date(b.event_time).getTime();
        return dateB - dateA;
      } catch (error) {
        console.error(`❌ [META-ACTIVITIES] Erro ao ordenar activities:`, { error: error.message });
        return 0;
      }
    });
    
    // Encontrar o funding_event_successful mais recente
    const latestFunding = sortedActivities.find(activity => 
      activity && activity.event_type === 'funding_event_successful'
    );
    
    if (!latestFunding) {
      console.log(`⚠️ [META-ACTIVITIES] Nenhum evento de funding encontrado`);
      return null;
    }
    
    console.log(`🔍 [META-ACTIVITIES] Funding encontrado:`, {
      event_type: latestFunding.event_type,
      event_time: latestFunding.event_time,
      has_extra_data: !!latestFunding.extra_data
    });
    
    const fundingData = parseExtraData(latestFunding.extra_data);
    if (!fundingData || !fundingData.amount) {
      console.log(`⚠️ [META-ACTIVITIES] Dados de funding inválidos:`, {
        extraData: latestFunding.extra_data?.substring(0, 100),
        fundingData
      });
      return null;
    }
    
    // Valor do funding em centavos convertido para reais
    const fundingAmount = fundingData.amount / 100;
    const fundingDate = new Date(latestFunding.event_time);
    
    if (isNaN(fundingAmount) || isNaN(fundingDate.getTime())) {
      console.error(`❌ [META-ACTIVITIES] Dados de funding corrompidos:`, {
        amount: fundingData.amount,
        fundingAmount,
        event_time: latestFunding.event_time,
        fundingDate
      });
      return null;
    }
    
    console.log(`💰 [META-ACTIVITIES] Funding mais recente encontrado:`, {
      date: fundingDate.toLocaleString('pt-BR'),
      amount: `R$ ${fundingAmount.toFixed(2)}`,
      currency: fundingData.currency || 'BRL'
    });
    
    // Encontrar todas as cobranças posteriores ao funding
    const chargesAfterFunding = sortedActivities.filter(activity => {
      try {
        if (!activity || activity.event_type !== 'ad_account_billing_charge') return false;
        
        const chargeDate = new Date(activity.event_time);
        if (isNaN(chargeDate.getTime())) return false;
        
        return chargeDate > fundingDate;
      } catch (error) {
        console.error(`❌ [META-ACTIVITIES] Erro ao filtrar cobrança:`, { error: error.message });
        return false;
      }
    });
    
    // Calcular total das cobranças
    let totalCharges = 0;
    let validCharges = 0;
    
    for (const charge of chargesAfterFunding) {
      try {
        const chargeData = parseExtraData(charge.extra_data);
        if (chargeData && chargeData.new_value && !isNaN(chargeData.new_value)) {
          // Valor da cobrança em centavos convertido para reais
          const chargeAmount = chargeData.new_value / 100;
          totalCharges += chargeAmount;
          validCharges++;
          
          console.log(`💸 [META-ACTIVITIES] Cobrança encontrada:`, {
            date: new Date(charge.event_time).toLocaleString('pt-BR'),
            amount: `R$ ${chargeAmount.toFixed(2)}`,
            currency: chargeData.currency || 'BRL'
          });
        }
      } catch (error) {
        console.error(`❌ [META-ACTIVITIES] Erro ao processar cobrança:`, { error: error.message });
      }
    }
    
    const remainingBalance = fundingAmount - totalCharges;
    
    console.log(`✅ [META-ACTIVITIES] Cálculo de saldo concluído:`, {
      fundingAmount: `R$ ${fundingAmount.toFixed(2)}`,
      totalCharges: `R$ ${totalCharges.toFixed(2)}`,
      validCharges,
      remainingBalance: `R$ ${remainingBalance.toFixed(2)}`,
      isNegative: remainingBalance < 0
    });
    
    return {
      saldo_restante: remainingBalance,
      funding_detected: true,
      last_funding_date: latestFunding.event_time,
      charges_since_funding: validCharges,
      funding_amount: fundingAmount,
      total_charges: totalCharges
    };
    
  } catch (error) {
    console.error(`❌ [META-ACTIVITIES] ERRO CRÍTICO no cálculo de saldo:`, {
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}


// Verificar se existe funding nos últimos 60 dias
function hasFundingInLast60Days(activities: any[]): boolean {
  if (!activities || activities.length === 0) return false;
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const recentFunding = activities.find(activity => {
    if (activity.event_type !== 'funding_event_successful') return false;
    
    const activityDate = new Date(activity.event_time);
    return activityDate >= sixtyDaysAgo;
  });
  
  console.log(`🔍 [META-API] Funding nos últimos 60 dias:`, !!recentFunding);
  return !!recentFunding;
}

// Função principal para buscar saldo da conta Meta
export async function fetchMetaBalance(accountId: string, accessToken: string, supabase: any) {
  const startTime = Date.now();
  console.log(`💰 [META-API] Iniciando busca de saldo para conta ${accountId}`);

  try {
    // 1. Buscar informações básicas da conta PRIMEIRO (sempre da API Graph)
    console.log(`🔍 [META-API] Buscando informações básicas...`);
    const basicInfo = await fetchAccountBasicInfo(accountId, accessToken);
    
    // 2. CONTA PRÉ-PAGA: buscar saldo diretamente da API Graph usando display_string
    if (basicInfo.is_prepay_account) {
      console.log(`💳 [META-API] Conta pré-paga detectada, buscando saldo da API...`);
      
      const balanceUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=account_status,balance,expired_funding_source_details&access_token=${accessToken}`;
      const balanceResponse = await fetch(balanceUrl);
      
      if (!balanceResponse.ok) {
        console.error(`❌ [META-API] Erro na API de saldo:`, balanceResponse.status);
        return { 
          saldo_restante: null, 
          source: 'api_error',
          is_prepay_account: true
        };
      }
      
      const balanceData = await balanceResponse.json();
      console.log(`🔍 [META-API] Resposta da API de saldo:`, balanceData);
      
      // Log da estrutura de expired_funding_source_details para debug
      if (balanceData.expired_funding_source_details) {
        console.log(`📋 [META-API] expired_funding_source_details encontrado:`, balanceData.expired_funding_source_details);
      }
      
      let balanceValue = null;
      let displayString = null;
      
      // PRIORIDADE 1: Usar display_string real da API
      if (balanceData.expired_funding_source_details?.display_string) {
        displayString = balanceData.expired_funding_source_details.display_string;
        console.log(`✅ [META-API] Display string REAL da API:`, displayString);
        
        balanceValue = parseMetaBalance(displayString);
        console.log(`💰 [META-API] Valor extraído do display_string:`, balanceValue);
      }
      
      // PRIORIDADE 2: Fallback para valor numérico se display_string não estiver disponível
      if (balanceValue === null && balanceData.balance) {
        const rawBalance = parseFloat(balanceData.balance) / 100;
        balanceValue = rawBalance;
        console.log(`⚠️ [META-API] Usando fallback - valor numérico direto:`, balanceValue);
      }
      
      if (balanceValue !== null) {
        const responseTime = Date.now() - startTime;
        console.log(`✅ [META-API] Saldo pré-pago obtido (${responseTime}ms):`, balanceValue);
        
        return { 
          saldo_restante: balanceValue,
          source: 'graph_api',
          is_prepay_account: true
        };
      }
    }
    
    // 3. CONTA PÓS-PAGA: verificar funding nos últimos 60 dias
    console.log(`🏦 [META-API] Conta pós-paga detectada, verificando funding...`);
    
    try {
      const activities = await fetchAccountActivities(accountId, accessToken);
      
      if (!activities || activities.length === 0) {
        console.log(`ℹ️ [META-API] Nenhuma activity encontrada`);
        return { 
          saldo_restante: null, 
          source: 'no_activities',
          is_prepay_account: false
        };
      }
      
      // 3.1. Verificar se há funding nos últimos 60 dias
      const hasFunding60Days = hasFundingInLast60Days(activities);
      
      if (!hasFunding60Days) {
        console.log(`ℹ️ [META-API] SEM funding nos últimos 60 dias - pagamentos automáticos`);
        return { 
          saldo_restante: null, 
          source: 'automatic_payments',
          is_prepay_account: false,
          funding_detected: false
        };
      }
      
      // 3.2. TEM funding nos últimos 60 dias
      console.log(`💰 [META-API] FUNDING encontrado nos últimos 60 dias!`);
      console.log(`ℹ️ [META-API] Para contas pós-pagas com funding, usuário deve consultar saldo no Business Manager`);
      
      // 3.3. Calcular saldo baseado nas activities (para salvar funding info)
      const balanceCalc = calculateBalanceFromActivities(activities);
      
      if (balanceCalc && balanceCalc.funding_detected) {
        const responseTime = Date.now() - startTime;
        console.log(`💰 [META-API] Funding detectado:`, {
          funding_detected: balanceCalc.funding_detected,
          last_funding_date: balanceCalc.last_funding_date,
          funding_amount: balanceCalc.funding_amount,
          total_charges: balanceCalc.total_charges
        });
        
        return { 
          saldo_restante: null,
          source: 'funding_available_manual_check',
          is_prepay_account: false,
          funding_detected: true,
          last_funding_date: balanceCalc.last_funding_date,
          funding_amount: balanceCalc.funding_amount,
          total_charges: balanceCalc.total_charges
        };
      }
      
    } catch (activityError) {
      console.error(`❌ [META-API] Erro ao processar activities:`, activityError);
    }
    
    // 4. Fallback: sem saldo disponível
    const responseTime = Date.now() - startTime;
    console.log(`⚠️ [META-API] Saldo não disponível (${responseTime}ms)`);
    
    return { 
      saldo_restante: null,
      source: 'unavailable',
      is_prepay_account: basicInfo.is_prepay_account
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [META-API] ERRO CRÍTICO ao buscar saldo (${responseTime}ms):`, error);
    
    return { 
      saldo_restante: null,
      source: 'error',
      is_prepay_account: null,
      error: error.message
    };
  }
}

// Função para buscar informações básicas da conta Meta
export async function fetchAccountBasicInfo(accountId: string, accessToken: string) {
  console.log(`🔍 [META-API] Buscando informações básicas da conta ${accountId}`);
  
  try {
    const basicInfoUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=name,currency,account_status,is_prepay_account&access_token=${accessToken}`;
    
    const response = await fetch(basicInfoUrl);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ [META-API] Erro da API Meta (${response.status}) - Body:`, errorBody);
      throw new Error(`Meta API error: ${response.status} - ${response.statusText} | ${errorBody}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ [META-API] Informações básicas obtidas:`, {
      name: data.name,
      currency: data.currency,
      isPrepayAccount: data.is_prepay_account,
      accountStatus: data.account_status
    });
    
    return {
      accountName: data.name,
      currency: data.currency,
      is_prepay_account: data.is_prepay_account,
      accountStatus: data.account_status,
      lastFundingDate: null,
      lastFundingAmount: null
    };
    
  } catch (error) {
    console.error(`❌ [META-API] Erro ao buscar informações básicas:`, error);
    throw error;
  }
}

// Função para buscar dados da API Meta (campanhas, gastos, etc)
export async function fetchMetaApiData(accountId: string, accessToken: string, customBudget: any = null) {
  const startTime = Date.now();
  console.log(`🚀 [META-API] === INICIANDO BUSCA DE DADOS API ===`);
  console.log(`📋 [META-API] Parâmetros: {
  accountId: ${accountId},
  accessTokenPresent: ${!!accessToken},
  customBudget: ${customBudget ? 'SIM' : 'NÃO'}
}`);

  try {
    // 1. Buscar TODAS as campanhas da conta com paginação
    let allCampaigns: any[] = [];
    let campaignsNextUrl: string | null = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=id,name,status,effective_status,daily_budget,lifetime_budget&access_token=${accessToken}&limit=500`;
    let pageCount = 0;
    
    console.log(`📞 [META-API] Buscando campanhas (com paginação)...`);
    
    while (campaignsNextUrl) {
      pageCount++;
      const campaignsResponse = await fetch(campaignsNextUrl);
      if (!campaignsResponse.ok) {
        throw new Error(`Campaigns API error: ${campaignsResponse.status} - ${campaignsResponse.statusText}`);
      }
      
      const campaignsData = await campaignsResponse.json();
      const pageCampaigns = campaignsData.data || [];
      allCampaigns = allCampaigns.concat(pageCampaigns);
      
      campaignsNextUrl = campaignsData.paging?.next || null;
      
      if (campaignsNextUrl) {
        console.log(`📄 [META-API] Página ${pageCount}: ${pageCampaigns.length} campanhas, buscando próxima página...`);
      }
    }
    
    const campaigns = allCampaigns;
    console.log(`✅ [META-API] ${campaigns.length} campanhas encontradas (${pageCount} página(s))`);
    
    // 2. Processar campanhas e calcular orçamento total
    let totalDailyBudget = 0;
    let activeCampaignsCount = 0;
    const campaignBudgets: Array<{ name: string; budget: number; source: 'campaign' | 'adset'; campaign_name?: string }> = [];
    const now = new Date();
    
    console.log(`🔄 [META-API] Processando campanhas...`);
    
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      
      console.log(`
🔍 [META-API] Processando campanha ${i + 1}: {
  id: "${campaign.id}",
  name: "${campaign.name}",
  status: "${campaign.status}",
  effectiveStatus: "${campaign.effective_status}",
  dailyBudget: "${campaign.daily_budget}"
}`);
      
      // Verificar se a campanha está ativa
      if (campaign.status !== "ACTIVE") {
        console.log(`[META-API] SKIP - Status não ativo: ${campaign.status}`);
        continue;
      }
      
      if (campaign.effective_status !== "ACTIVE") {
        console.log(`[META-API] SKIP - Effective status não ativo: ${campaign.effective_status}`);
        continue;
      }
      
      activeCampaignsCount++;
      
      // Se a campanha tem orçamento direto, usar ele
      if (campaign.daily_budget) {
        const budgetValue = parseFloat(campaign.daily_budget) / 100; // Converter de centavos
        totalDailyBudget += budgetValue;
        campaignBudgets.push({ name: campaign.name, budget: budgetValue, source: 'campaign' });
        console.log(`💰 [META-API] Orçamento direto: R$ ${budgetValue.toFixed(2)} (${Date.now() - startTime}ms)`);
        continue;
      }
      
      // Se não tem orçamento direto, buscar dos adsets
      try {
        const adsets = await fetchAdSets(campaign.id, accessToken, campaign.name);
        const activeAdsets = filterActiveAdsets(adsets, now, campaign.id);
        
        for (const adset of activeAdsets) {
          if (adset.daily_budget) {
            const budgetValue = parseFloat(adset.daily_budget) / 100; // Converter de centavos
            totalDailyBudget += budgetValue;
            campaignBudgets.push({ name: adset.name, budget: budgetValue, source: 'adset', campaign_name: campaign.name });
            console.log(`💰 [META-API] Orçamento do adset ${adset.name}: R$ ${budgetValue.toFixed(2)}`);
          }
        }
      } catch (adsetError) {
        console.error(`❌ [META-API] Erro ao buscar adsets da campanha ${campaign.id}:`, adsetError);
      }
    }
    
    console.log(`📊 [META-API] Resultado do processamento:`, {
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaignsCount,
      totalDailyBudget: `R$ ${totalDailyBudget.toFixed(2)}`
    });
    
    // 3. Buscar gastos do mês atual ATÉ ONTEM (para cálculo consistente do orçamento ideal)
    // Isso garante que a recomendação seja a mesma às 08h ou às 18h
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Se há orçamento personalizado, usar a data de início dele como período de gastos
    const periodStart = customBudget?.start_date
      ? new Date(customBudget.start_date + 'T00:00:00')
      : new Date(today.getFullYear(), today.getMonth(), 1);
    
    const sinceParam = periodStart.toISOString().split('T')[0];
    // Usar ontem para garantir consistência no cálculo do orçamento ideal
    // Isso evita que o gasto parcial de hoje afete a recomendação
    const untilParam = yesterday.toISOString().split('T')[0];
    
    // Tratamento especial: se ontem é anterior ao início do período, não há gasto confirmado
    let totalSpent = 0;
    
    if (yesterday < periodStart) {
      console.log(`📅 [META-API] Início do período (${sinceParam}) - gasto confirmado até ontem = R$ 0`);
    } else {
      console.log(`💸 [META-API] Buscando gastos de ${sinceParam} até ${untilParam} (até ontem)...`);
      
      const insightsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=spend&time_range={'since':'${sinceParam}','until':'${untilParam}'}&access_token=${accessToken}`;
      
      const insightsResponse = await fetch(insightsUrl);
      if (!insightsResponse.ok) {
        console.error(`❌ [META-API] Erro na API de insights:`, insightsResponse.status);
        throw new Error(`Insights API error: ${insightsResponse.status} - ${insightsResponse.statusText}`);
      }
      
      const insightsData = await insightsResponse.json();
      const insights = insightsData.data || [];
      
      if (insights.length > 0 && insights[0].spend) {
        totalSpent = parseFloat(insights[0].spend);
      }
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [META-API] Gastos até ontem obtidos (${responseTime}ms): R$ ${totalSpent.toFixed(2)}`);
    
    // 4. Buscar nome da conta
    console.log(`🏷️ [META-API] Buscando nome da conta...`);
    const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=name&access_token=${accessToken}`;
    
    const accountResponse = await fetch(accountUrl);
    let accountName = `Conta ${accountId}`;
    
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      accountName = accountData.name || accountName;
    }
    
    const finalResponseTime = Date.now() - startTime;
    console.log(`🎉 [META-API] === BUSCA CONCLUÍDA (${finalResponseTime}ms) ===`);
    console.log(`📋 [META-API] Resultado final:`, {
      account_name: accountName,
      daily_budget: totalDailyBudget,
      total_spent: totalSpent,
      active_campaigns: activeCampaignsCount
    });
    
    return {
      account_name: accountName,
      daily_budget: totalDailyBudget,
      total_spent: totalSpent,
      active_campaigns: activeCampaignsCount,
      campaign_budgets: campaignBudgets
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [META-API] ERRO CRÍTICO (${responseTime}ms):`, error);
    throw error;
  }
}
