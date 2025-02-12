
export type PaymentStatus = 'pending' | 'completed';

export interface Payment {
  id: number;
  client_id: number;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface PaymentFormData {
  clientId: number;
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface PaymentFilters {
  startDate?: string;
  endDate?: string;
  clientId?: number;
  status?: PaymentStatus;
}
