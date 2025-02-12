
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
  const needsPayment = client.status === 'active' && !client.hasCurrentMonthPayment;

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
          {client.company_name}
        </div>
      </TableCell>
      <TableCell>{formatCurrency(client.contract_value)}</TableCell>
      <TableCell>
        <PaymentHistory 
          total={client.total_received}
          payments={client.payments}
          clientName={client.company_name}
          onPaymentUpdated={onPaymentUpdated}
        />
      </TableCell>
      <TableCell>
        <Badge 
          variant={client.status === 'active' ? 'default' : 'destructive'}
          className={`capitalize ${client.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          {client.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPaymentClick(client.id)}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Registrar Pagamento
        </Button>
      </TableCell>
    </TableRow>
  );
}
