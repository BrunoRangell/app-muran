export interface AnalysisResult {
  success: boolean;
  message: string;
  meta_total_spent: number;
  meta_daily_budget_current: number;
  meta: any;
}

export interface SimpleMetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
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
