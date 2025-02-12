
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaymentStatus, PaymentFilters } from "@/types/payment";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentFiltersBar } from "@/components/payments/PaymentFiltersBar";
import { NewPaymentDialog } from "@/components/payments/NewPaymentDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const { toast } = useToast();

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          clients (
            company_name
          )
        `)
        .order('due_date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('due_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('due_date', filters.endDate);
      }
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erro ao carregar recebimentos",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return data;
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

      <PaymentsTable 
        payments={payments} 
        isLoading={isLoading} 
      />

      <NewPaymentDialog 
        open={isNewPaymentOpen}
        onOpenChange={setIsNewPaymentOpen}
        onSuccess={() => {
          refetch();
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
