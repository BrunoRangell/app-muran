
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
  payment_type: string; // Changed from union type to match database
  status: string; // Changed from union type to match database
  acquisition_channel: string | null;
  company_birthday: string | null;
  contact_name: string;
  contact_phone: string;
  last_payment_date: string | null;
  created_at?: string;
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
