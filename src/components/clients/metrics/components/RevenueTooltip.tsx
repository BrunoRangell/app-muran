import { formatCurrency } from "@/utils/formatters";
import { PaymentDetail } from "../utils/calculateMonthlyMetrics";

interface RevenueTooltipProps {
  paymentDetails: PaymentDetail[];
  totalRevenue: number;
}

export const RevenueTooltip = ({ paymentDetails, totalRevenue }: RevenueTooltipProps) => {
  if (!paymentDetails.length && totalRevenue === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhum pagamento registrado neste mês
      </div>
    );
  }

  if (!paymentDetails.length && totalRevenue > 0) {
    return (
      <div className="text-sm">
        <div className="font-semibold text-primary">
          Total: {formatCurrency(totalRevenue)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Receita calculada baseada nos contratos ativos
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-sm">
        Total: {formatCurrency(totalRevenue)}
      </div>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {paymentDetails.map((payment, index) => (
          <div key={index} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
            <div className="flex-1 truncate">
              <div className="font-medium">{payment.company_name}</div>
              <div className="text-gray-500 capitalize">{payment.status}</div>
            </div>
            <div className="font-semibold text-primary">
              {formatCurrency(payment.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};