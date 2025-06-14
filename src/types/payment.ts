
export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  reference_month: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  clients?: {
    id: string;
    company_name: string;
    status?: string;
  };
}

export interface PaymentFormData {
  client_id: string;
  amount: number;
  reference_month: string;
  notes?: string;
}
