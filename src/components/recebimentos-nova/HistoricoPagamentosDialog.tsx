
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { Payment } from "@/types/payment";

interface HistoricoPagamentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  payments: Payment[];
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

export const HistoricoPagamentosDialog = ({
  open,
  onOpenChange,
  clientName,
  payments,
  onEdit,
  onDelete
}: HistoricoPagamentosDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Pagamentos - {clientName}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <PaymentsTable
            payments={payments}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
