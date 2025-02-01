export interface Column {
  id: string;
  label: string;
  show: boolean;
  fixed?: boolean;
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
  retention?: number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

export type PeriodFilter = 'this-month' | 'last-3-months' | 'last-6-months' | 'last-12-months' | 'this-year' | 'last-year' | 'custom';