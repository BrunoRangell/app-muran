export interface MetaCampaign {
  name: string;
  id: string;
  spend: number;
  status: string;
}

export interface MetaDateRange {
  start: string;
  end: string;
}

export interface MetaData {
  dailyBudget: number;
  totalSpent: number;
  accountId: string;
  dateRange?: MetaDateRange;
  campaigns?: MetaCampaign[];
}

export interface AnalysisResult {
  success: boolean;
  reviewId: number;
  client: any;
  meta: MetaData;
  message: string;
  meta_total_spent?: number;
  meta_daily_budget_current?: number;
}

export interface SimpleMetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
}

export interface SimpleMetaData {
  totalSpent: number;
  dailyBudget: number;
  accountId: string;
  dateRange: {
    start: string;
    end: string;
  };
  campaigns: SimpleMetaCampaign[];
}

export interface SimpleAnalysisResult {
  success: boolean;
  reviewId?: number;
  client?: {
    id: string;
    company_name: string;
    meta_account_id: string;
  };
  meta: SimpleMetaData;
  message: string;
}
