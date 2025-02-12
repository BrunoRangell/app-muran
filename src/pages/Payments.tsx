
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaymentFilters, PaymentSummary } from "@/types/payment";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentFiltersBar } from "@/components/payments/PaymentFiltersBar";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { NewPaymentDialog } from "@/components/payments/NewPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PaymentsClientList } from "@/components/payments/PaymentsClientList";

export default function Payments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments', filters.startDate, filters.endDate],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          clients:client_id (
            company_name,
            status
          )
        `)
        .order('payment_date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('payment_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('payment_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const calculateSummaries = () => {
    if (!payments) return null;

    const summaries = {
      received: {
        title: "Recebidas",
        grossAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        netAmount: payments.reduce((sum, p) => sum + p.net_amount, 0),
        clientCount: new Set(payments.map(p => p.client_id)).size,
        paymentCount: payments.length,
        color: "#16A34A",
        status: "RECEIVED" as const
      }
    };

    return summaries;
  };

  const summaries = calculateSummaries();

  const handleClientPayment = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsNewPaymentOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recebimentos</h1>
      </div>

      <PaymentFiltersBar 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {!isLoadingPayments && summaries && (
        <div className="grid grid-cols-1 gap-4">
          <PaymentSummaryCard data={summaries.received} />
        </div>
      )}

      <PaymentsClientList onPaymentClick={handleClientPayment} />

      <PaymentsTable 
        payments={payments || []} 
        isLoading={isLoadingPayments}
      />

      <NewPaymentDialog 
        open={isNewPaymentOpen}
        onOpenChange={setIsNewPaymentOpen}
        clientId={selectedClientId}
        onSuccess={() => {
          setIsNewPaymentOpen(false);
          setSelectedClientId(null);
          toast({
            title: "Pagamento registrado",
            description: "O pagamento foi registrado com sucesso!",
          });
        }}
      />
    </div>
  );
}
