
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaymentStatus, PaymentFilters, PaymentSummary } from "@/types/payment";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentFiltersBar } from "@/components/payments/PaymentFiltersBar";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewPaymentDialog } from "@/components/payments/NewPaymentDialog";
import { useToast } from "@/hooks/use-toast";

const ASAAS_API_URL = 'https://api.asaas.com/v3';

export default function Payments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      // TODO: Implementar chamada real à API do Asaas quando tivermos a chave
      return {
        received: {
          title: "Recebidas",
          grossAmount: 18579.00,
          netAmount: 18547.16,
          clientCount: 16,
          paymentCount: 16,
          color: "#16A34A",
          status: "RECEIVED" as PaymentStatus
        },
        confirmed: {
          title: "Confirmadas",
          grossAmount: 0,
          netAmount: 0,
          clientCount: 0,
          paymentCount: 0,
          color: "#2563EB",
          status: "CONFIRMED" as PaymentStatus
        },
        pending: {
          title: "Aguardando pagamento",
          grossAmount: 6137.00,
          netAmount: 6131.03,
          clientCount: 3,
          paymentCount: 3,
          color: "#EA580C",
          status: "PENDING" as PaymentStatus
        }
      };
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recebimentos</h1>
        <Button onClick={() => setIsNewPaymentOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      <PaymentFiltersBar 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {!isLoading && payments && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PaymentSummaryCard data={payments.received} />
          <PaymentSummaryCard data={payments.confirmed} />
          <PaymentSummaryCard data={payments.pending} />
        </div>
      )}

      <NewPaymentDialog 
        open={isNewPaymentOpen}
        onOpenChange={setIsNewPaymentOpen}
        onSuccess={() => {
          setIsNewPaymentOpen(false);
          toast({
            title: "Cobrança criada",
            description: "A cobrança foi registrada com sucesso!",
          });
        }}
      />
    </div>
  );
}
