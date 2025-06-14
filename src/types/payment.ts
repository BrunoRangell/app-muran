
export type PaymentStatus = 'RECEIVED' | 'CONFIRMED' | 'PENDING' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED';

export interface PaymentSummary {
  title: string;
  grossAmount: number;
  netAmount: number;
  clientCount: number;
  paymentCount: number;
  color: string;
  status: PaymentStatus;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  reference_month: string;
  notes: string | null;
  created_at: string;
  clients: {
    company_name: string;
  };
}

export interface PaymentFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
}
