
import { Client } from "@/components/clients/types";

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface Payment {
  id: number;
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

export interface EditPaymentDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  clientName: string;
}
