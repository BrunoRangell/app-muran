
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
  payment_date: string | null;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
  clients: {
    company_name: string;
  };
  net_amount: number;
}

export interface PaymentFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  status?: PaymentStatus;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  status: string;
  paymentDate: string;
  customerName: string;
}
