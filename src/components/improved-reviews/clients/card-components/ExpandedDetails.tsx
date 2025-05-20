
import { Calendar, BadgeDollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateBr } from "@/utils/dateFormatter";

interface ExpandedDetailsProps {
  platform: "meta" | "google";
  client: any;
  isUsingCustomBudget: boolean;
  customBudget: any | null;
  originalBudgetAmount: number;
  budgetAmount: number;
  lastFiveDaysAvg: number;
}

export function ExpandedDetails({
  platform,
  client,
  isUsingCustomBudget,
  customBudget,
  originalBudgetAmount,
  budgetAmount,
  lastFiveDaysAvg
}: ExpandedDetailsProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Orçamento diário atual</span>
        <span className="font-medium">{formatCurrency(client.review?.[`${platform}_daily_budget_current`] || 0)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Orçamento diário ideal</span>
        <span className="font-medium">{formatCurrency(client.budgetCalculation?.idealDailyBudget || 0)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Dias restantes</span>
        <span className="font-medium">{client.budgetCalculation?.remainingDays || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Média gasto (5 dias)</span>
        <span className="font-medium">{formatCurrency(lastFiveDaysAvg)}</span>
      </div>
      
      {isUsingCustomBudget && customBudget && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
          <div className="flex items-center gap-1 text-sm mb-1">
            <BadgeDollarSign className="h-4 w-4 text-[#ff6e00]" />
            <span className="font-medium text-[#ff6e00]">Orçamento Personalizado</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Período</span>
            <span className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              {formatDateBr(customBudget.start_date)} a {formatDateBr(customBudget.end_date)}
            </span>
          </div>
          {originalBudgetAmount !== budgetAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Orçamento padrão</span>
              <span className="font-medium">{formatCurrency(originalBudgetAmount)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
