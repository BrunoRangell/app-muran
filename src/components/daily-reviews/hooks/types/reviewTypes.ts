export interface MetaAccount {
  id: string;
  client_id: string;
  account_id: string;
  account_name: string;
  budget_amount: number;
  is_primary: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientWithReview {
  id: string;
  company_name: string;
  meta_account_id?: string;
  meta_ads_budget?: number;
  status: string;
  lastReview?: any;
  needsBudgetAdjustment?: boolean;
  meta_accounts?: MetaAccount[];
}
