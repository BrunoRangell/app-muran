
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { PaymentHistory } from "../PaymentHistory";
import { ClientWithTotalPayments } from "../types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PaymentsTableRowProps {
  client: ClientWithTotalPayments;
  onPaymentClick: (clientId: string) => void;
  onPaymentUpdated: () => void;
}

export function PaymentsTableRow({ 
  client, 
  onPaymentClick,
  onPaymentUpdated 
}: PaymentsTableRowProps) {
  // Garantir que temos valores válidos para evitar erros
  const { 
    id = "", 
    company_name = "Cliente sem nome", 
    contract_value = 0, 
    status = "inactive",
    total_received = 0,
    payments = [],
    hasCurrentMonthPayment = false
  } = client || {};
  
  const needsPayment = status === 'active' && !hasCurrentMonthPayment;
  
  return (
    <TableRow className={cn(
      needsPayment && "bg-[#FEC6A1]/10 hover:bg-[#FEC6A1]/20",
      "transition-colors duration-200"
    )}>
      <TableCell>
        <div className="flex items-center gap-2">
          {needsPayment && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pagamento do mês atual não registrado</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {company_name}
        </div>
      </TableCell>
      <TableCell>{formatCurrency(contract_value)}</TableCell>
      <TableCell>
        <PaymentHistory 
          total={total_received}
          payments={payments}
          clientName={company_name}
          onPaymentUpdated={onPaymentUpdated}
        />
      </TableCell>
      <TableCell>
        <Badge 
          variant={status === 'active' ? 'default' : 'destructive'}
          className={`capitalize ${status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          {status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPaymentClick(id)}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Registrar Pagamento
        </Button>
      </TableCell>
    </TableRow>
  );
}
