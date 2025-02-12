
import { PaymentSummary } from "@/types/payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { ChevronRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentSummaryCardProps {
  data: PaymentSummary;
}

export function PaymentSummaryCard({ data }: PaymentSummaryCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {data.title}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 ml-2 inline-block text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Valor líquido: {formatCurrency(data.netAmount)}</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: data.color }}>
          {formatCurrency(data.grossAmount)}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(data.netAmount)} líquido
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {data.clientCount} {data.clientCount === 1 ? 'cliente' : 'clientes'}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {data.paymentCount} {data.paymentCount === 1 ? 'cobrança' : 'cobranças'}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
