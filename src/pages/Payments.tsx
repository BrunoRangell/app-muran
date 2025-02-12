
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaymentFilters, PaymentSummary } from "@/types/payment";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentsClientList } from "@/components/payments/PaymentsClientList";
import { NewPaymentDialog } from "@/components/payments/NewPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Payments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const { toast } = useToast();

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments', dateRange?.start, dateRange?.end],
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

      if (dateRange?.start) {
        query = query.gte('payment_date', dateRange.start.toISOString().split('T')[0]);
      }
      if (dateRange?.end) {
        query = query.lte('payment_date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const handleClientPayment = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsNewPaymentOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recebimentos</h1>
      </div>

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
