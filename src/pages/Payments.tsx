
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaymentFilters, PaymentSummary } from "@/types/payment";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentFiltersBar } from "@/components/payments/PaymentFiltersBar";
import { PaymentSummaryCard } from "@/components/payments/PaymentSummaryCard";
import { Button } from "@/components/ui/button";
import { NewPaymentDialog } from "@/components/payments/NewPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('status', { ascending: false }) // Clientes ativos primeiro
        .order('company_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Calcular os sumários de pagamentos
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

      <div className="border rounded-lg divide-y">
        {clients?.map((client) => (
          <div 
            key={client.id} 
            className="p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <div>
              <h3 className="font-medium">{client.company_name}</h3>
              <p className="text-sm text-gray-500">
                Valor mensal: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(client.contract_value)}
              </p>
              <span 
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {client.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClientId(client.id);
                setIsNewPaymentOpen(true);
              }}
              disabled={client.status !== 'active'}
            >
              Registrar Pagamento
            </Button>
          </div>
        ))}
      </div>

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
