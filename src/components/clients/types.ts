
export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export type PeriodFilter = 
  | 'last-3-months' 
  | 'last-6-months' 
  | 'last-12-months'
  | 'last-24-months'
  | 'this-year' 
  | 'last-year' 
  | 'custom';

export interface FinancialMetricsData {
  activeClientsCount: number;
  mrr: number;
  arr: number;
  averageRetention: number;
  ltv: number;
  totalClients: number;
  churnRate: number;
  averageTicket: number;
  totalCosts: number;
}

export interface Client {
  id: string;
  company_name: string;
  contract_value: number;
  first_payment_date: string;
  payment_type: "pre" | "post";
  status: "active" | "inactive";
  acquisition_channel: string;
  company_birthday: string;
  contact_name: string;
  contact_phone: string;
  last_payment_date: string | null;
}

export interface Column {
  id: string;
  label: string;
  show: boolean;
  fixed?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}
