
import { useState } from "react";
import { useSimplePaymentsData } from "@/hooks/common/useSimplePaymentsData";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { RegistroPagamentoDialog } from "@/components/recebimentos-nova/RegistroPagamentoDialog";
import { EditarPagamentoDialog } from "@/components/recebimentos-nova/EditarPagamentoDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Payment } from "@/types/payment";

export default function RecebimentosNova() {
  const [isRegistroOpen, setIsRegistroOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  
  const { clientsWithPayments, isLoadingClients, refetchClients } = useSimplePaymentsData();

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditOpen(true);
  };

  const handleDelete = async (paymentId: string) => {
    console.log('Delete payment:', paymentId);
  };

  const handleSuccess = () => {
    refetchClients();
    setIsRegistroOpen(false);
    setIsEditOpen(false);
    setSelectedPayment(null);
    setSelectedClient(null);
  };

  const handleNewPayment = () => {
    // Para o novo pagamento, vamos usar o primeiro cliente como padrão
    // ou permitir que o usuário selecione no dialog
    setSelectedClient(clientsWithPayments[0] || null);
    setIsRegistroOpen(true);
  };

  // Extrair todos os pagamentos dos clientes
  const allPayments = clientsWithPayments.reduce((acc, client) => {
    const payments = client.payments?.map(payment => ({
      ...payment,
      clients: { company_name: client.company_name }
    })) || [];
    return [...acc, ...payments];
  }, [] as Payment[]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recebimentos</h1>
        <Button onClick={handleNewPayment}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pagamento
        </Button>
      </div>

      <PaymentsTable
        payments={allPayments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoadingClients}
      />

      <RegistroPagamentoDialog
        open={isRegistroOpen}
        onOpenChange={setIsRegistroOpen}
        cliente={selectedClient}
        onSuccess={handleSuccess}
      />

      {selectedPayment && (
        <EditarPagamentoDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          pagamento={selectedPayment}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
