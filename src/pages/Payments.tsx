
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
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export default function Payments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const { toast } = useToast();

  const { data: asaasPayments, isLoading: isLoadingAsaas } = useQuery({
    queryKey: ['asaas-payments', filters.startDate, filters.endDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('asaas', {
        body: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        }
      });
      if (error) throw error;
      console.log('Pagamentos recebidos do Asaas:', data.payments);
      return data.payments;
    }
  });

  // Função para mapear os status do Asaas para nossos status
  const mapAsaasStatus = (asaasStatus: string): PaymentStatus => {
    switch (asaasStatus.toUpperCase()) {
      case 'RECEIVED':
      case 'CONFIRMED':
        return 'RECEIVED';
      case 'PENDING':
        return 'PENDING';
      case 'OVERDUE':
        return 'OVERDUE';
      case 'REFUNDED':
        return 'REFUNDED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  };

  // Transformar os pagamentos do Asaas para o formato da nossa aplicação
  const payments = asaasPayments?.map(payment => {
    console.log('Mapeando pagamento:', payment);
    return {
      id: payment.id,
      client_id: payment.customer,
      amount: payment.value,
      net_amount: payment.netValue,
      payment_date: payment.paymentDate,
      status: mapAsaasStatus(payment.status),
      notes: null,
      created_at: payment.paymentDate,
      clients: {
        company_name: payment.customerName || 'Nome não disponível'
      }
    };
  });

  // Calcular os sumários de pagamentos
  const calculateSummaries = () => {
    if (!payments) return null;

    const summaries = {
      received: {
        title: "Recebidas",
        grossAmount: 0,
        netAmount: 0,
        clientCount: 0,
        paymentCount: 0,
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
        grossAmount: 0,
        netAmount: 0,
        clientCount: 0,
        paymentCount: 0,
        color: "#EA580C",
        status: "PENDING" as PaymentStatus
      }
    };

    const clients = new Set<string>();

    payments.forEach(payment => {
      let category: keyof typeof summaries;
      
      switch (payment.status) {
        case 'RECEIVED':
          category = 'received';
          break;
        case 'CONFIRMED':
          category = 'confirmed';
          break;
        case 'PENDING':
          category = 'pending';
          break;
        default:
          return; // Ignora outros status para os cards de sumário
      }

      summaries[category].grossAmount += payment.amount;
      summaries[category].netAmount += payment.net_amount;
      summaries[category].paymentCount += 1;
      clients.add(payment.client_id);
    });

    // Atualiza a contagem de clientes para cada categoria
    Object.values(summaries).forEach(summary => {
      summary.clientCount = clients.size;
    });

    return summaries;
  };

  const summaries = calculateSummaries();

  console.log('Pagamentos após mapeamento:', payments);

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

      {!isLoadingAsaas && summaries && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PaymentSummaryCard data={summaries.received} />
          <PaymentSummaryCard data={summaries.confirmed} />
          <PaymentSummaryCard data={summaries.pending} />
        </div>
      )}

      <PaymentsTable 
        payments={payments} 
        isLoading={isLoadingAsaas}
      />

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
