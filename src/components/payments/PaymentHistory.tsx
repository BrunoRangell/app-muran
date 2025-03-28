
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Payment } from "./types";
import { formatCurrency } from "@/utils/formatters";
import { Pencil, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditPaymentDialog } from "./EditPaymentDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentHistoryProps {
  total: number;
  payments: Payment[];
  clientName: string;
  onPaymentUpdated: () => void;
}

const formatReferenceMonth = (monthStr: string) => {
  if (!monthStr) return '';
  try {
    const date = parseISO(monthStr);
    return format(date, "MMMM'/'yyyy", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar mês:', error, monthStr);
    return monthStr;
  }
};

export function PaymentHistory({ 
  total = 0, 
  payments = [], 
  clientName = '', 
  onPaymentUpdated 
}: PaymentHistoryProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  // Garantir que temos um array válido
  const validPayments = Array.isArray(payments) ? payments : [];

  return (
    <div className="flex items-center">
      <span className="w-28 text-right">{formatCurrency(total || 0)}</span>
      <div className="flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-secondary"
                onClick={() => setIsHistoryOpen(true)}
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver histórico</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos - {clientName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[50vh] w-full pr-4">
            <div className="space-y-4">
              {validPayments.length > 0 ? (
                validPayments.map((payment) => (
                  <div key={payment.id} className="border-b last:border-0 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {formatReferenceMonth(payment.reference_month)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(payment.amount || 0)}
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
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <EditPaymentDialog 
        payment={selectedPayment}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onPaymentUpdated}
        clientName={clientName}
      />
    </div>
  );
}
