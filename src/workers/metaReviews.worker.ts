/**
 * FASE 5A: Web Worker para processar dados Meta Ads
 * Processa combinação de clientes, contas, reviews e budgets em background thread
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

// FASE 5A: Incluir lógica de cálculo de budget no worker
const calculateBudget = (input: {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  customBudgetEndDate?: string;
  customBudgetStartDate?: string;
  warningIgnoredToday?: boolean;
}) => {
  const now = new Date();
  let remainingDays: number;
  
  if (input.customBudgetStartDate && input.customBudgetEndDate) {
    // Orçamento personalizado: calcular diferença real entre datas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Parse local para evitar deslocamento UTC
    const [sY, sM, sD] = input.customBudgetStartDate.split('-').map(Number);
    const startDate = new Date(sY, sM - 1, sD);
    const [eY, eM, eD] = input.customBudgetEndDate.split('-').map(Number);
    const endDate = new Date(eY, eM - 1, eD);
    
    // Se hoje é antes do início, usar período completo
    if (today < startDate) {
      const diffTime = endDate.getTime() - startDate.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } 
    // Se hoje é depois do fim, não há dias restantes
    else if (today > endDate) {
      remainingDays = 0;
    } 
    // Calcular dias de hoje até o fim
    else {
      const diffTime = endDate.getTime() - today.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  } else {
    // Orçamento mensal padrão
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    remainingDays = daysInMonth - currentDay + 1;
  }
  
  remainingDays = Math.max(remainingDays, 1);
  const remainingBudget = Math.max(input.monthlyBudget - input.totalSpent, 0);
  const idealDailyBudget = remainingBudget / remainingDays;
  const budgetDifference = idealDailyBudget - input.currentDailyBudget;
  
  // Threshold de R$ 5 para acusar ajuste necessário
  let needsBudgetAdjustment = false;
  
  if (!input.warningIgnoredToday) {
    needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;
  }
  
  return {
    idealDailyBudget,
    budgetDifference,
    remainingDays,
    remainingBudget,
    needsBudgetAdjustment,
  };
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
  const campaignHealthByClientAccount = new Map();
  campaignHealthData.forEach(health => {
    const key = `${health.client_id}_${health.account_id}`;
    campaignHealthByClientAccount.set(key, health);
  });
  
  const specificBudgets = new Map(); // key: client_id_account_id
  const globalBudgets = new Map();   // key: client_id (account_id is null)
  activeCustomBudgets.forEach(budget => {
    if (budget.account_id) {
      specificBudgets.set(`${budget.client_id}_${budget.account_id}`, budget);
    } else {
      globalBudgets.set(budget.client_id, budget);
    }
  });

  // Filtrar contas com account_id vazio (registros sem ID real)
  const validMetaAccounts = metaAccounts.filter(acc => acc.account_id && acc.account_id.trim() !== '');

  const clientsWithAccounts = new Set();
  validMetaAccounts.forEach(account => {
    clientsWithAccounts.add(account.client_id);
  });
  
  const clientsWithoutAccount = clients.filter(client => 
    !clientsWithAccounts.has(client.id)
  ).length || 0;

  const clientsWithData = clients.map(client => {
    if (!client.company_name) {
      client.company_name = `Cliente ${client.id.slice(0, 8)}`;
    }
    
    const clientMetaAccounts = validMetaAccounts.filter(account => 
      account.client_id === client.id
    ) || [];
    
    if (clientMetaAccounts.length > 0) {
      return clientMetaAccounts.map(account => {
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
        } else {
          const specificKey = `${client.id}_${account.id}`;
          const matchingBudget = specificBudgets.get(specificKey) || globalBudgets.get(client.id);
          if (matchingBudget) {
            customBudget = matchingBudget;
            monthlyBudget = matchingBudget.budget_amount;
            isUsingCustomBudget = true;
            customBudgetEndDate = matchingBudget.end_date;
            customBudgetStartDate = matchingBudget.start_date;
          }
        }
        
        const balanceInfo = account.saldo_restante !== null || account.is_prepay_account !== null ? {
          balance: account.saldo_restante || 0,
          balance_type: account.saldo_restante !== null ? "numeric" : (account.is_prepay_account === false ? "credit_card" : "unavailable"),
          balance_value: account.saldo_restante,
          billing_model: account.is_prepay_account ? "pre" : "pos"
        } : null;
        
        const healthKey = `${client.id}_${account.id}`;
        const healthData = campaignHealthByClientAccount.get(healthKey);
        const veiculationStatus = getVeiculationStatus(healthData);
        
        // FASE 5A: Calcular budget no worker
        const budgetCalc = calculateBudget({
          monthlyBudget,
          totalSpent: review?.total_spent || 0,
          currentDailyBudget: review?.daily_budget_current || 0,
          customBudgetEndDate,
          customBudgetStartDate,
          warningIgnoredToday,
        });
        
        return {
          ...client,
          meta_account_id: account.account_id,
          meta_account_uuid: account.id, // UUID do client_accounts para queries
          meta_account_name: account.account_name,
          budget_amount: monthlyBudget,
          original_budget_amount: account.budget_amount,
          review: review || null,
          budgetCalculation: {
            ...budgetCalc,
            warningIgnoredToday,
          },
          needsAdjustment: budgetCalc.needsBudgetAdjustment,
          customBudget,
          isUsingCustomBudget,
          hasAccount: true,
          meta_daily_budget: review?.daily_budget_current || 0,
          balance_info: balanceInfo || null,
          veiculationStatus,
          last_funding_detected_at: account.last_funding_detected_at,
          last_funding_amount: account.last_funding_amount
        };
      });
    } else {
      return {
        ...client,
        meta_account_id: null,
        meta_account_name: "Sem conta cadastrada",
        budget_amount: 0,
        original_budget_amount: 0,
        review: null,
        budgetCalculation: {
          idealDailyBudget: 0,
          budgetDifference: 0,
          remainingDays: 0,
          remainingBudget: 0,
          needsBudgetAdjustment: false,
          warningIgnoredToday: false
        },
        needsAdjustment: false,
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

  const flattenedClients = clientsWithData.flat();
  
  const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
  const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.total_spent || 0), 0);
  
  return {
    clients: flattenedClients,
    metrics: {
      totalClients: clientsWithAccounts.size,
      clientsWithoutAccount,
      totalBudget,
      totalSpent,
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
