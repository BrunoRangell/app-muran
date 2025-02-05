export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export type PeriodFilter = 
  | 'last-3-months' 
  | 'last-6-months' 
  | 'last-12-months' 
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
}
