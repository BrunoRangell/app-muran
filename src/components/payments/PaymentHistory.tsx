
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Payment } from "./types";
import { formatCurrency } from "@/utils/formatters";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditPaymentDialog } from "./EditPaymentDialog";

interface PaymentHistoryProps {
  total: number;
  payments: Payment[];
  clientName: string;
  onPaymentUpdated: () => void;
}

const formatReferenceMonth = (monthStr: string) => {
  try {
    const date = parseISO(monthStr);
    return format(date, "MMMM'/'yyyy", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar mês:', error, monthStr);
    return monthStr;
  }
};

export function PaymentHistory({ total, payments, clientName, onPaymentUpdated }: PaymentHistoryProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">
              {formatCurrency(total)}
            </span>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="max-w-[400px] p-4"
            sideOffset={40}
          >
            <div className="space-y-2">
              <p className="font-medium text-sm mb-2">Histórico de Pagamentos:</p>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {payments && payments.length > 0 ? (
                  payments.map((payment) => (
                    <div key={payment.id} className="border-b last:border-0 pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {formatReferenceMonth(payment.reference_month)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(payment.amount)}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEdit(payment)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum pagamento registrado
                  </p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <EditPaymentDialog 
        payment={selectedPayment}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onPaymentUpdated}
        clientName={clientName}
      />
    </>
  );
}
