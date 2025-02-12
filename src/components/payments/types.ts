
import { Client } from "@/components/clients/types";

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface Payment {
  amount: number;
  reference_month: string;
  notes: string | null;
}

export interface ClientWithTotalPayments extends Client {
  total_received: number;
  payments: Payment[];
}

export interface PaymentsClientListProps {
  onPaymentClick: (clientId: string) => void;
}
