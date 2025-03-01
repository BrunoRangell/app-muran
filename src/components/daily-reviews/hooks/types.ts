
export interface AnalysisResult {
  success: boolean;
  message: string;
  meta_total_spent: number;
  meta_daily_budget_current: number;
  meta: any;
  client?: {
    id: string;
    company_name: string;
    meta_account_id: string;
  };
}

export interface SimpleMetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  insights?: {
    data?: Array<{
      spend?: number | string;
    }>;
  };
}

export interface SimpleAnalysisResult {
  success: boolean;
  message: string;
  meta: {
    totalSpent: number;
    dailyBudget: number;
    dateRange: {
      start: string;
      end: string;
    };
    campaigns: SimpleMetaCampaign[];
  };
}

// Adicionar interfaces para MetaCampaign e MetaDateRange
export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
}

export interface MetaDateRange {
  start: string;
  end: string;
}
