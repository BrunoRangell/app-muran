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

// Função para buscar atividades da conta Meta (período personalizável)
async function fetchAccountActivities(
  accountId: string, 
  accessToken: string, 
  sinceDate?: Date, 
  untilDate?: Date
) {
  const startTime = Date.now();
  
  // Se não fornecido, usar últimos 60 dias
  const since = sinceDate 
    ? sinceDate.toISOString().split('T')[0]
    : new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const until = untilDate 
    ? untilDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  
  console.log(`🔍 [META-ACTIVITIES] Buscando activities para conta ${accountId} (${since} até ${until})`);
  
  try {
    const activitiesUrl = `https://graph.facebook.com/v22.0/act_${accountId}/activities?since=${since}&until=${until}&fields=event_type,translated_event_type,event_time,extra_data&access_token=${accessToken}&limit=1000`;
    
    // Timeout específico para activities API (5 segundos)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [META-ACTIVITIES] Timeout na Activities API após 5s para conta ${accountId}`);
      controller.abort();
    }, 5000);
    
    const response = await fetch(activitiesUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Parse error' }));
      console.error(`❌ [META-ACTIVITIES] ERRO na API para conta ${accountId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        responseTime: `${responseTime}ms`
      });
      throw new Error(`Activities API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const activities = data.data || [];
    
    // Validar estrutura das activities
    if (!Array.isArray(activities)) {
      console.error(`❌ [META-ACTIVITIES] Resposta inválida para conta ${accountId}:`, data);
      throw new Error('Invalid activities response structure');
    }
    
    // Filtrar apenas eventos relevantes
    const relevantActivities = activities.filter(activity => {
      if (!activity || !activity.event_type) return false;
      return activity.event_type === 'funding_event_successful' || 
             activity.event_type === 'ad_account_billing_charge';
    });
    
    console.log(`✅ [META-ACTIVITIES] Activities obtidas:`, {
      accountId,
      responseTime: `${responseTime}ms`,
      totalActivities: activities.length,
      relevantActivities: relevantActivities.length,
      fundingEvents: relevantActivities.filter(a => a.event_type === 'funding_event_successful').length,
      billingEvents: relevantActivities.filter(a => a.event_type === 'ad_account_billing_charge').length
    });
    
    return relevantActivities;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [META-ACTIVITIES] ERRO EXCEPTION conta ${accountId}:`, {
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      isAbortError: error.name === 'AbortError'
    });
    
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
    
    const { data: accountData, error: accountError } = await supabase
      .from("client_accounts")
      .select("saldo_restante, balance_set_at, is_prepay_account")
      .eq("account_id", accountId)
      .eq("platform", "meta")
      .single();

    if (accountError) {
      console.log(`⚠️ [META-API] Erro ao buscar dados da conta: ${accountError.message}`);
    }

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
        
        return {
          saldo_restante: recalculatedBalance,
          is_prepay_account: true, // Assume pré-pago quando há saldo manual
          funding_detected: true,
          last_funding_date: accountData.balance_set_at,
          charges_since_funding: accountData.saldo_restante - recalculatedBalance
        };
      } catch (error) {
        console.error(`❌ [META-API] Erro no recálculo, usando saldo manual original: ${error.message}`);
        
        return {
          saldo_restante: accountData.saldo_restante,
          is_prepay_account: true,
          funding_detected: true,
          last_funding_date: accountData.balance_set_at,
          charges_since_funding: 0
        };
      }
    }

    // 3. FALLBACK: Se não há saldo manual, usar lógica de API Meta básica
    console.log(`🔄 [META-API] Sem saldo manual, usando API Meta para conta ${accountId}`);
    
    const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=name,balance,currency,expired_funding_source_details,is_prepay_account,spend_cap,amount_spent&access_token=${accessToken}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(accountUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    const basicDataTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [META-API] ERRO na API para conta ${accountId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        responseTime: `${basicDataTime}ms`
      });
      
      return { saldo_restante: null, is_prepay_account: false, funding_detected: false };
    }

    const data = await response.json();
    console.log(`✅ [META-API] Dados básicos obtidos (${basicDataTime}ms):`, {
      accountName: data.name,
      isPrepayAccount: data.is_prepay_account,
      currency: data.currency
    });
    
    // 4. Se é pré-pago, extrair saldo da API
    if (data.is_prepay_account) {
      console.log(`🏦 [META-API] Conta PRÉ-PAGA - extraindo saldo da API`);
      
      let saldo_restante = null;
      
      // Extrair saldo do expired_funding_source_details ou balance
      if (data.expired_funding_source_details?.display_string) {
        const match = data.expired_funding_source_details.display_string.match(/R\$\s*([\d.,]+)/);
        if (match && match[1]) {
          saldo_restante = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
          console.log(`💰 [META-API] Saldo extraído: R$ ${saldo_restante.toFixed(2)}`);
        }
      } else if (data.balance) {
        saldo_restante = parseFloat(data.balance) / 100 * 5.5; // Conversão USD para BRL
        console.log(`💰 [META-API] Saldo do balance: R$ ${saldo_restante.toFixed(2)}`);
      }
      
      return { 
        saldo_restante, 
        is_prepay_account: true,
        funding_detected: false,
        last_funding_date: null,
        charges_since_funding: 0
      };
    }
    
    // 5. Conta pós-paga - sem saldo disponível
    console.log(`🏦 [META-API] Conta PÓS-PAGA - saldo não disponível`);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [META-API] Processamento concluído (${totalTime}ms)`);
    
    return { 
      saldo_restante: null, 
      is_prepay_account: false,
      funding_detected: false,
      last_funding_date: null,
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
      is_prepay_account: false,
      funding_detected: false,
      last_funding_date: null,
      charges_since_funding: 0
    };
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