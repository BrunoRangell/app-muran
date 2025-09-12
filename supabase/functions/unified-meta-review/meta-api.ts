// Funções para interagir com a Meta Graph API

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

// Função para recalcular saldo baseado no saldo manual definido pelo usuário
async function recalculateBalanceFromManual(
  accountId: string, 
  accessToken: string, 
  manualBalance: number, 
  balanceSetAt: string
): Promise<number> {
  console.log(`🎯 [RECALCULO] Iniciando recálculo para conta ${accountId} desde ${balanceSetAt}`);
  
  try {
    // Converter balanceSetAt para ISO format para a API
    const sinceDate = new Date(balanceSetAt);
    const untilDate = new Date();
    
    // Buscar activities desde o momento que o saldo foi definido
    const activities = await fetchAccountActivities(accountId, accessToken, sinceDate, untilDate);
    
    if (!activities || activities.length === 0) {
      console.log(`ℹ️ [RECALCULO] Nenhuma activity encontrada desde ${balanceSetAt}, mantendo saldo manual`);
      return manualBalance;
    }
    
    // Filtrar apenas charges (gastos) posteriores ao timestamp
    const charges = activities.filter(activity => {
      const isCharge = activity.event_type === "ad_account_billing_charge";
      const activityDate = new Date(activity.event_time);
      const isAfterManualSet = activityDate > sinceDate;
      
      return isCharge && isAfterManualSet;
    });
    
    console.log(`💳 [RECALCULO] ${charges.length} charges encontradas desde ${balanceSetAt}`);
    
    // Calcular total de gastos
    let totalCharges = 0;
    for (const charge of charges) {
      const extraData = parseExtraData(charge.extra_data);
      if (extraData?.new_value) {
        const chargeAmount = parseFloat(extraData.new_value) / 100; // Converter de centavos para reais
        totalCharges += chargeAmount;
        
        console.log(`💸 [RECALCULO] Charge: R$ ${chargeAmount.toFixed(2)} em ${charge.event_time}`);
      }
    }
    
    // Calcular saldo atual: saldo_manual - total_de_gastos
    const currentBalance = manualBalance - totalCharges;
    
    console.log(`✅ [RECALCULO] Saldo calculado:`, {
      saldoManual: `R$ ${manualBalance.toFixed(2)}`,
      totalGastos: `R$ ${totalCharges.toFixed(2)}`,
      saldoAtual: `R$ ${currentBalance.toFixed(2)}`,
      ehNegativo: currentBalance < 0
    });
    
    return currentBalance;
    
  } catch (error) {
    console.error(`❌ [RECALCULO] Erro no recálculo:`, error);
    throw error;
  }
}

// Função para buscar saldo e modelo de cobrança da Meta API com lógica manual
export async function fetchMetaBalance(accountId: string, accessToken: string, supabase: any) {
  const startTime = Date.now();
  console.log(`💰 [META-API] Iniciando busca de saldo para conta ${accountId}`);
  
  try {
    // 1. PRIMEIRO: Verificar se existe saldo manual definido
    console.log(`🔍 [META-API] Verificando saldo manual no banco para conta ${accountId}`);
    
    const { data: accountData, error: accountError, count: accountCount } = await supabase
      .from("client_accounts")
      .select("saldo_restante, balance_set_at, is_prepay_account", { count: "exact" })
      .eq("account_id", accountId)
      .eq("platform", "meta")
      .single();

    console.log(`📘 [META-API] Resultado da consulta client_accounts:`, { count: accountCount, error: accountError?.message });

    // 2. Se existe saldo manual e timestamp, usar lógica de recálculo
    if (accountData?.balance_set_at && accountData.saldo_restante !== null) {
      console.log(`🎯 [META-API] Saldo manual encontrado: R$ ${accountData.saldo_restante} definido em ${accountData.balance_set_at}`);
      
      try {
        const recalculatedBalance = await recalculateBalanceFromManual(
          accountId, 
          accessToken, 
          accountData.saldo_restante, 
          accountData.balance_set_at
        );
        
        const totalTime = Date.now() - startTime;
        console.log(`✅ [META-API] SALDO MANUAL - Recálculo concluído (${totalTime}ms)`);
        
        // Buscar is_prepay_account da API Graph
        const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=is_prepay_account&access_token=${accessToken}`;
        const graphResponse = await fetch(accountUrl);
        let isPrepayFromGraph = false;
        
        if (graphResponse.ok) {
          const graphData = await graphResponse.json();
          isPrepayFromGraph = Boolean(graphData.is_prepay_account);
          console.log(`🔍 [META-API] is_prepay_account da API Graph: ${isPrepayFromGraph}`);
        }
        
        return {
          saldo_restante: recalculatedBalance,
          is_prepay_account: isPrepayFromGraph, // Sempre da API Graph
          funding_detected: true,
          last_funding_date: accountData.balance_set_at,
          funding_amount: accountData.saldo_restante, // Incluir funding_amount
          charges_since_funding: accountData.saldo_restante - recalculatedBalance
        };
      } catch (error) {
        console.error(`❌ [META-API] Erro no recálculo, usando saldo manual original: ${error.message}`);
        
        // Buscar is_prepay_account da API Graph
        const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=is_prepay_account&access_token=${accessToken}`;
        const graphResponse = await fetch(accountUrl);
        let isPrepayFromGraph = false;
        
        if (graphResponse.ok) {
          const graphData = await graphResponse.json();
          isPrepayFromGraph = Boolean(graphData.is_prepay_account);
          console.log(`🔍 [META-API] is_prepay_account da API Graph (fallback): ${isPrepayFromGraph}`);
        }
        
        return {
          saldo_restante: accountData.saldo_restante,
          is_prepay_account: isPrepayFromGraph, // Sempre da API Graph
          funding_detected: true,
          last_funding_date: accountData.balance_set_at,
          funding_amount: accountData.saldo_restante, // Incluir funding_amount
          charges_since_funding: 0
        };
      }
    }

    // 3. FALLBACK: Se não há saldo manual, usar a nova lógica de fetchAccountBasicInfo
    console.log(`🔄 [META-API] Sem saldo manual, usando fetchAccountBasicInfo para conta ${accountId}`);
    
    const basicInfo = await fetchAccountBasicInfo(accountId, accessToken);
    const basicDataTime = Date.now() - startTime;
    
    console.log(`✅ [META-API] Dados básicos obtidos via fetchAccountBasicInfo (${basicDataTime}ms):`, basicInfo);
    
    // 4. Se é pré-pago, extrair saldo da API
    if (basicInfo.is_prepay_account) {
      console.log(`🏦 [META-API] Conta PRÉ-PAGA - extraindo saldo da API`);
      
      // Buscar saldo detalhado da API Meta
      const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=balance,expired_funding_source_details,spend_cap,amount_spent&access_token=${accessToken}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(accountUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log(`🔍 [META-BALANCE] CAMPOS CRUS PARA SALDO: {
  "balance": ${JSON.stringify(data.balance)},
  "expired_funding_source_details": ${JSON.stringify(data.expired_funding_source_details)},
  "spend_cap": ${JSON.stringify(data.spend_cap)},
  "amount_spent": ${JSON.stringify(data.amount_spent)}
}`);
        
        let saldo_restante = null;
        
        // Extrair saldo do expired_funding_source_details ou balance
        if (data.expired_funding_source_details?.display_string) {
          const match = data.expired_funding_source_details.display_string.match(/R\$\s*([\d.,]+)/);
          if (match && match[1]) {
            saldo_restante = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
            console.log(`💰 [META-API] Saldo extraído de display_string: R$ ${saldo_restante.toFixed(2)}`);
          }
        } else if (data.balance) {
          saldo_restante = parseFloat(data.balance) / 100 * 5.5; // Conversão USD para BRL
          console.log(`💰 [META-API] Saldo extraído de balance: R$ ${saldo_restante.toFixed(2)}`);
        }
        
        return { 
          saldo_restante, 
          is_prepay_account: basicInfo.is_prepay_account, // Sempre da API Graph
          funding_detected: false,
          last_funding_date: null,
          funding_amount: null, // Incluir funding_amount
          charges_since_funding: 0
        };
      }
    }
    
    // 5. Conta pós-paga - buscar funding via activities
    console.log(`🏦 [META-API] Conta PÓS-PAGA - buscando funding via activities`);
    
    try {
      const activities = await fetchAccountActivities(accountId, accessToken);
      const balanceResult = calculateBalanceFromActivities(activities);
      
      if (balanceResult) {
        console.log(`💰 [META-API] Funding detectado via activities:`, balanceResult);
        return {
          saldo_restante: balanceResult.saldo_restante,
          is_prepay_account: basicInfo.is_prepay_account, // Sempre da API Graph
          funding_detected: true,
          last_funding_date: balanceResult.last_funding_date,
          funding_amount: balanceResult.funding_amount, // Incluir funding_amount
          charges_since_funding: balanceResult.charges_since_funding
        };
      }
    } catch (error) {
      console.error(`❌ [META-API] Erro ao buscar activities para conta pós-paga:`, error.message);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [META-API] Processamento concluído (${totalTime}ms) - sem saldo disponível`);
    
    return { 
      saldo_restante: null, 
      is_prepay_account: basicInfo.is_prepay_account, // Sempre da API Graph
      funding_detected: false,
      last_funding_date: null,
      funding_amount: null, // Incluir funding_amount
      charges_since_funding: 0
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [META-API] ERRO CRÍTICO conta ${accountId}:`, {
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`
    });
    
    return { 
      saldo_restante: null, 
      is_prepay_account: false, // Em caso de erro, assumir pós-paga
      funding_detected: false,
      last_funding_date: null,
      funding_amount: null, // Incluir funding_amount
      charges_since_funding: 0
    };
  }
}

// Função para buscar informações básicas da conta (incluindo funding check)
export async function fetchAccountBasicInfo(accountId: string, accessToken: string) {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 [META-API] Buscando info da conta ${accountId}`);

    const fields = 'name,balance,currency,expired_funding_source_details,is_prepay_account,spend_cap,amount_spent,funding_source_type';
    const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=${fields}&access_token=${accessToken}`;
    console.log(`🌐 [META-API] URL final: ${accountUrl.replace(accessToken, '[TOKEN]')}`);

    const response = await fetch(accountUrl);
    console.log(`📡 [META-API] Status da resposta: ${response.status}`);
    const basicDataTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [META-API] ERRO na API para conta ${accountId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        responseTime: `${basicDataTime}ms`
      });
      
      return { accountName: null, isPrepayAccount: false, currency: "BRL", lastFundingDate: null, lastFundingAmount: null };
    }

    const data = await response.json();
    console.log(`✅ [META-API] Resposta da API recebida:`, JSON.stringify(data, null, 2));

    // LOG DETALHADO DOS CAMPOS CRUS DA API
    console.log(`🔍 [META-API] CAMPOS CRUS DA API: {
  "is_prepay_account": ${JSON.stringify(data.is_prepay_account)},
  "balance": ${JSON.stringify(data.balance)},
  "expired_funding_source_details": ${JSON.stringify(data.expired_funding_source_details)},
  "spend_cap": ${JSON.stringify(data.spend_cap)},
  "amount_spent": ${JSON.stringify(data.amount_spent)},
  "funding_source_type": ${JSON.stringify(data.funding_source_type)}
}`);

    // Extrair informações básicas
    const accountName = data.name || 'Nome não encontrado';
    const currency = data.currency || 'BRL';
    
    // SEMPRE usar is_prepay_account da API Graph
    const isPrepayAccount = Boolean(data.is_prepay_account);
    const detectionMethod = 'api_graph_only';
    console.log(`🏦 [META-API] Tipo de conta da API Graph: ${isPrepayAccount ? 'PRÉ-PAGA' : 'PÓS-PAGA'}`)

    console.log(`🎯 [META-API] DECISÃO FINAL: ${isPrepayAccount ? 'PRÉ-PAGA' : 'PÓS-PAGA'} (método: ${detectionMethod})`);

    // Buscar funding via activities para qualquer tipo de conta (para completude de dados)
    let lastFundingDate: string | null = null;
    let lastFundingAmount: number | null = null;
    
    console.log(`🔍 [META-API] Buscando funding via activities para conta ${accountId}...`);
    
    try {
      const activitiesResult = await fetchAccountActivities(accountId, accessToken);
      
      if (activitiesResult && activitiesResult.last_funding_date) {
        lastFundingDate = activitiesResult.last_funding_date;
        lastFundingAmount = activitiesResult.funding_amount;
        console.log(`✅ [META-API] Funding encontrado: data=${lastFundingDate}, valor=R$${lastFundingAmount}`);
      } else {
        console.log(`ℹ️ [META-API] Nenhum funding encontrado via activities`);
      }
    } catch (activitiesError) {
      console.error(`⚠️ [META-API] Erro ao buscar activities:`, activitiesError);
    }

    const result = {
      accountName,
      currency,
      is_prepay_account: isPrepayAccount,
      lastFundingDate,
      lastFundingAmount,
      accountId,
      clientName: accountName
    };

    const finalTime = Date.now() - startTime;
    console.log(`✅ [META-API] fetchAccountBasicInfo concluído (${finalTime}ms):`, result);
    
    return result;

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [META-API] ERRO na busca de dados básicos:`, {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });
    return { accountName: null, isPrepayAccount: false, currency: "BRL", lastFundingDate: null, lastFundingAmount: null };
  }
}

// Função para buscar dados reais da Meta Graph API
export async function fetchMetaApiData(accountId: string, accessToken: string, customBudget: any) {
  const totalStartTime = Date.now();
  console.log(`🚀 [META-API] INICIANDO busca para conta ${accountId}`);
  console.log(`🚀 [META-API] Custom budget ativo:`, !!customBudget);
  
  try {
    // 1. Buscar campanhas ativas para calcular orçamento diário total
    const campaignsStartTime = Date.now();
    const campaignsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=daily_budget,lifetime_budget,status,effective_status,end_time,name&access_token=${accessToken}&limit=1000`;
    console.log(`📞 [META-API] Buscando campanhas da conta ${accountId}`);
    
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsResponseTime = Date.now() - campaignsStartTime;
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      console.error(`❌ [META-API] ERRO API conta ${accountId}:`, {
        status: campaignsResponse.status,
        statusText: campaignsResponse.statusText,
        error: errorData,
        responseTime: `${campaignsResponseTime}ms`
      });
      return { daily_budget: 0, total_spent: 0, account_name: null };
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data || [];
    
    console.log(`✅ [META-API] Campanhas obtidas conta ${accountId}:`, {
      totalCampaigns: campaigns.length,
      responseTime: `${campaignsResponseTime}ms`,
      campaignNames: campaigns.slice(0, 5).map(c => c.name)
    });

    // Calcular orçamento diário total das campanhas ativas
    let totalDailyBudget = 0;
    const now = new Date();
    let processedCampaigns = 0;
    let campaignsWithBudget = 0;
    let campaignsNeedingAdsets = 0;
    
    // Processar cada campanha
    for (const campaign of campaigns) {
      const campaignStartTime = Date.now();
      processedCampaigns++;
      
      console.log(`\n🔍 [META-API] Processando campanha ${processedCampaigns}:`, {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        effectiveStatus: campaign.effective_status,
        dailyBudget: campaign.daily_budget
      });
      
      // Verificar se a campanha está ativa
      if (campaign.status !== "ACTIVE") {
        console.log(`[META-API] SKIP - Status não ativo: ${campaign.status}`);
        continue;
      }

      // Verificar effective_status também
      if (campaign.effective_status !== "ACTIVE") {
        console.log(`[META-API] SKIP - Effective status: ${campaign.effective_status}`);
        continue;
      }

      // Verificar data de término
      if (campaign.end_time) {
        const endTime = new Date(campaign.end_time);
        const isFuture = endTime > now;
        if (!isFuture) {
          console.log(`[META-API] SKIP - Expirada em ${endTime.toLocaleDateString('pt-BR')}`);
          continue;
        }
      }

      // Se a campanha tem orçamento diário, usar ele
      if (campaign.daily_budget && parseInt(campaign.daily_budget) > 0) {
        const campaignBudget = parseInt(campaign.daily_budget) / 100; // Converte de centavos para reais
        totalDailyBudget += campaignBudget;
        campaignsWithBudget++;
        
        const campaignTime = Date.now() - campaignStartTime;
        console.log(`💰 [META-API] Orçamento direto: R$ ${campaignBudget.toFixed(2)} (${campaignTime}ms)`);
      } 
      // Se não tem orçamento diário ou é zero, buscar adsets
      else {
        campaignsNeedingAdsets++;
        console.log(`🔍 [META-API] Buscando adsets - sem orçamento direto`);
        
        // Buscar adsets da campanha
        const adsetsStartTime = Date.now();
        const adsets = await fetchAdSets(campaign.id, accessToken, campaign.name);
        const adsetsTime = Date.now() - adsetsStartTime;
        
        console.log(`📊 [META-API] Adsets obtidos: ${adsets.length} (${adsetsTime}ms)`);
        
        const activeAdsets = filterActiveAdsets(adsets, now, campaign.id);
        
        // Somar orçamentos dos adsets ativos
        let adsetBudgetSum = 0;
        let adsetsWithBudget = 0;
        
        for (const adset of activeAdsets) {
          if (adset.daily_budget && parseInt(adset.daily_budget) > 0) {
            const adsetBudget = parseInt(adset.daily_budget) / 100; // Converte de centavos para reais
            adsetBudgetSum += adsetBudget;
            adsetsWithBudget++;
          }
        }
        
        if (adsetBudgetSum > 0) {
          totalDailyBudget += adsetBudgetSum;
        }
        
        const campaignTime = Date.now() - campaignStartTime;
        console.log(`💰 [META-API] Orçamento via adsets: R$ ${adsetBudgetSum.toFixed(2)}`, {
          totalAdsets: adsets.length,
          activeAdsets: activeAdsets.length,
          adsetsWithBudget,
          campaignTime: `${campaignTime}ms`
        });
      }
    }

    const budgetCalculationTime = Date.now() - campaignsStartTime;
    console.log(`💰 [META-API] Cálculo concluído:`, {
      totalDailyBudget: `R$ ${totalDailyBudget.toFixed(2)}`,
      processedCampaigns,
      campaignsWithBudget,
      campaignsNeedingAdsets,
      calculationTime: `${budgetCalculationTime}ms`
    });

    // 2. Buscar insights de gasto para o período atual
    const insightsStartTime = Date.now();
    const today = new Date();
    const startDate = customBudget 
      ? customBudget.start_date 
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`; // Início do mês atual
    const endDate = customBudget 
      ? customBudget.end_date 
      : today.toISOString().split('T')[0]; // Hoje

    console.log(`📅 [META-API] Buscando gastos período: ${startDate} até ${endDate}`);

    const insightsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=spend&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${accessToken}`;
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsResponseTime = Date.now() - insightsStartTime;
    
    if (!insightsResponse.ok) {
      const insightsError = await insightsResponse.json();
      console.error(`❌ [META-API] ERRO API conta ${accountId}:`, {
        status: insightsResponse.status,
        statusText: insightsResponse.statusText,
        error: insightsError,
        responseTime: `${insightsResponseTime}ms`
      });
      return { daily_budget: totalDailyBudget, total_spent: 0, account_name: null };
    }

    const insightsData = await insightsResponse.json();
    
    console.log(`✅ [META-API] Dados obtidos:`, {
      responseTime: `${insightsResponseTime}ms`,
      dataLength: insightsData.data?.length || 0,
      rawData: insightsData
    });

    // Calcular gasto total
    let totalSpent = 0;
    if (insightsData.data && insightsData.data.length > 0) {
      insightsData.data.forEach(insight => {
        if (insight.spend) {
          const spendValue = parseFloat(insight.spend);
          if (!isNaN(spendValue)) {
            totalSpent += spendValue;
          }
        }
      });
    }

    console.log(`💸 [META-API] Gasto calculado: R$ ${totalSpent.toFixed(2)}`);

    // 3. Buscar informações detalhadas da conta Meta (nome da conta)
    const accountInfoStartTime = Date.now();
    console.log(`🔍 [META-API] Buscando info da conta ${accountId}`);
    
    const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=name,account_id&access_token=${accessToken}`;
    
    let accountName = null;
    try {
      const accountResponse = await fetch(accountUrl);
      const accountInfoTime = Date.now() - accountInfoStartTime;
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        accountName = accountData.name;
        console.log(`✅ [META-API] Nome obtido: ${accountName} (${accountInfoTime}ms)`);
      } else {
        console.log(`⚠️ [META-API] Erro ao obter nome (${accountInfoTime}ms):`, {
          status: accountResponse.status,
          statusText: accountResponse.statusText
        });
      }
    } catch (error) {
      const accountInfoTime = Date.now() - accountInfoStartTime;
      console.log(`⚠️ [META-API] Exception (${accountInfoTime}ms):`, error.message);
    }

    const totalTime = Date.now() - totalStartTime;
    console.log(`🎉 [META-API] CONCLUÍDO conta ${accountId}:`, {
      totalTime: `${totalTime}ms`,
      dailyBudget: `R$ ${totalDailyBudget.toFixed(2)}`,
      totalSpent: `R$ ${totalSpent.toFixed(2)}`,
      accountName: accountName || 'N/A'
    });

    return {
      daily_budget: totalDailyBudget,
      total_spent: totalSpent,
      account_name: accountName
    };

  } catch (error) {
    const totalTime = Date.now() - totalStartTime;
    console.error(`❌ [META-API] ERRO GERAL conta ${accountId}:`, {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });
    return { daily_budget: 0, total_spent: 0, account_name: null };
  }
}