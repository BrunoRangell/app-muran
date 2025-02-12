
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentFilters } from "@/types/payment";
import { PaymentsClientList } from "@/components/payments/PaymentsClientList";
import { NewPaymentDialog } from "@/components/payments/NewPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Payments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleClientPayment = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsNewPaymentOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recebimentos</h1>
      </div>

      <PaymentsClientList onPaymentClick={handleClientPayment} />

      <NewPaymentDialog 
        open={isNewPaymentOpen}
        onOpenChange={setIsNewPaymentOpen}
        clientId={selectedClientId}
        onSuccess={() => {
          setIsNewPaymentOpen(false);
          setSelectedClientId(null);
          queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
          toast({
            title: "Pagamento registrado",
            description: "O pagamento foi registrado com sucesso!",
          });
        }}
      />
    </div>
  );
}
