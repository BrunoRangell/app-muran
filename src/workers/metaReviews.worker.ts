/**
 * FASE 4A: Web Worker para processar dados Meta Ads
 * Processa combinação de clientes, contas, revisões e budgets em background
 */

export type WorkerMessage = {
  type: 'PROCESS_META_DATA';
  payload: {
    clients: any[];
    metaAccounts: any[];
    reviews: any[];
    activeCustomBudgets: any[];
    campaignHealthData: any[];
  };
};

export type WorkerResponse = {
  type: 'PROCESSED_DATA' | 'ERROR';
  payload: any;
};

// Verificar se warning foi ignorado hoje
const checkWarningIgnored = (review: any): boolean => {
  if (!review) return false;
  
  const today = new Date().toISOString().split('T')[0];
  const ignoredDate = review.warning_ignored_date;
  const isIgnored = review.warning_ignored_today;
  
  return isIgnored && ignoredDate === today;
};

// Determinar status de veiculação
const getVeiculationStatus = (healthData: any) => {
  if (!healthData) {
    return {
      status: "no_data",
      activeCampaigns: 0,
      campaignsWithoutDelivery: 0,
      message: "Sem dados de veiculação",
      badgeColor: "bg-gray-500"
    };
  }

  const activeCampaigns = healthData.active_campaigns_count || 0;
  const campaignsWithoutDelivery = healthData.unserved_campaigns_count || 0;

  if (activeCampaigns === 0) {
    return {
      status: "no_campaigns",
      activeCampaigns: 0,
      campaignsWithoutDelivery: 0,
      message: "Nenhuma campanha ativa",
      badgeColor: "bg-gray-500"
    };
  }

  if (campaignsWithoutDelivery === 0) {
    return {
      status: "all_running",
      activeCampaigns,
      campaignsWithoutDelivery: 0,
      message: "Todas as campanhas rodando",
      badgeColor: "bg-green-500"
    };
  }

  if (campaignsWithoutDelivery === activeCampaigns) {
    return {
      status: "none_running",
      activeCampaigns,
      campaignsWithoutDelivery,
      message: "Nenhuma campanha com entrega",
      badgeColor: "bg-red-500"
    };
  }

  return {
    status: "partial_running",
    activeCampaigns,
    campaignsWithoutDelivery,
    message: `${campaignsWithoutDelivery} de ${activeCampaigns} sem entrega`,
    badgeColor: "bg-yellow-500"
  };
};

// Processar dados Meta
const processMetaData = (
  clients: any[],
  metaAccounts: any[],
  reviews: any[],
  activeCustomBudgets: any[],
  campaignHealthData: any[]
) => {
  // Mapear dados de campaign_health por client_id e account_id
  const campaignHealthByClientAccount = new Map();
  campaignHealthData.forEach(health => {
    const key = `${health.client_id}_${health.account_id}`;
    campaignHealthByClientAccount.set(key, health);
  });
  
  // Mapear orçamentos personalizados por client_id
  const customBudgetsByClientId = new Map();
  activeCustomBudgets.forEach(budget => {
    customBudgetsByClientId.set(budget.client_id, budget);
  });

  // Criar Set de clientes com contas Meta
  const clientsWithAccounts = new Set();
  metaAccounts.forEach(account => {
    clientsWithAccounts.add(account.client_id);
  });
  
  const clientsWithoutAccount = clients.filter(client => 
    !clientsWithAccounts.has(client.id)
  ).length || 0;

  // Combinar os dados
  const clientsWithData = clients.map(client => {
    // Validar company_name
    if (!client.company_name) {
      client.company_name = `Cliente ${client.id.slice(0, 8)}`;
    }
    
    // Buscar contas Meta para este cliente
    const clientMetaAccounts = metaAccounts.filter(account => 
      account.client_id === client.id
    ) || [];
    
    // Se o cliente tem contas Meta configuradas
    if (clientMetaAccounts.length > 0) {
      return clientMetaAccounts.map(account => {
        // Buscar a revisão mais recente para esta conta
        const clientReviews = reviews.filter(r => 
          r.client_id === client.id && 
          r.account_id === account.id
        ) || [];
        
        const review = clientReviews.length > 0 ? clientReviews[0] : null;
        const warningIgnoredToday = checkWarningIgnored(review);
        
        let customBudget = null;
        let monthlyBudget = account.budget_amount;
        let isUsingCustomBudget = false;
        let customBudgetEndDate = null;
        let customBudgetStartDate = null;
        
        // Verificar orçamento personalizado na revisão
        if (review?.using_custom_budget && review?.custom_budget_amount) {
          isUsingCustomBudget = true;
          monthlyBudget = review.custom_budget_amount;
          customBudgetEndDate = review.custom_budget_end_date;
          customBudgetStartDate = review.custom_budget_start_date;
          
          if (review.custom_budget_id) {
            customBudget = {
              id: review.custom_budget_id,
              budget_amount: review.custom_budget_amount,
              start_date: review.custom_budget_start_date,
              end_date: review.custom_budget_end_date
            };
          }
        } 
        // Verificar orçamento personalizado ativo
        else if (customBudgetsByClientId.has(client.id)) {
          const budget = customBudgetsByClientId.get(client.id);
          customBudget = budget;
          monthlyBudget = budget.budget_amount;
          isUsingCustomBudget = true;
          customBudgetEndDate = budget.end_date;
          customBudgetStartDate = budget.start_date;
        }
        
        // Buscar dados de saldo
        const balanceInfo = account.saldo_restante !== null || account.is_prepay_account !== null ? {
          balance: account.saldo_restante || 0,
          balance_type: account.saldo_restante !== null ? "numeric" : (account.is_prepay_account === false ? "credit_card" : "unavailable"),
          balance_value: account.saldo_restante,
          billing_model: account.is_prepay_account ? "pre" : "pos"
        } : null;
        
        // Buscar dados de veiculação
        const healthKey = `${client.id}_${account.id}`;
        const healthData = campaignHealthByClientAccount.get(healthKey);
        const veiculationStatus = getVeiculationStatus(healthData);
        
        return {
          ...client,
          meta_account_id: account.account_id,
          meta_account_name: account.account_name,
          budget_amount: monthlyBudget,
          original_budget_amount: account.budget_amount,
          review: review || null,
          warningIgnoredToday: warningIgnoredToday,
          customBudget: customBudget,
          isUsingCustomBudget: isUsingCustomBudget,
          customBudgetStartDate: customBudgetStartDate,
          customBudgetEndDate: customBudgetEndDate,
          hasAccount: true,
          meta_daily_budget: review?.daily_budget_current || 0,
          balance_info: balanceInfo || null,
          veiculationStatus: veiculationStatus,
          last_funding_detected_at: account.last_funding_detected_at,
          last_funding_amount: account.last_funding_amount
        };
      });
    } 
    // Cliente sem conta cadastrada
    else {
      return {
        ...client,
        meta_account_id: null,
        meta_account_name: "Sem conta cadastrada",
        budget_amount: 0,
        original_budget_amount: 0,
        review: null,
        warningIgnoredToday: false,
        customBudget: null,
        isUsingCustomBudget: false,
        hasAccount: false,
        veiculationStatus: {
          status: "no_data",
          activeCampaigns: 0,
          campaignsWithoutDelivery: 0,
          message: "Sem conta cadastrada",
          badgeColor: "bg-gray-500"
        }
      };
    }
  }) || [];

  // Achatar o array
  const flattenedClients = clientsWithData.flat();
  
  // Calcular métricas
  const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
  const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.total_spent || 0), 0);
  
  return {
    clients: flattenedClients,
    metrics: {
      totalClients: clientsWithAccounts.size,
      clientsWithoutAccount: clientsWithoutAccount,
      totalBudget: totalBudget,
      totalSpent: totalSpent,
      spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    }
  };
};

// Event listener
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    if (type === 'PROCESS_META_DATA') {
      const result = processMetaData(
        payload.clients,
        payload.metaAccounts,
        payload.reviews,
        payload.activeCustomBudgets,
        payload.campaignHealthData
      );

      self.postMessage({
        type: 'PROCESSED_DATA',
        payload: result,
      } as WorkerResponse);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    } as WorkerResponse);
  }
});
