
import { formatCurrency } from "@/utils/formatters";

interface CustomBudgetInfoProps {
  customBudgetAmount: number | null;
  formattedCustomBudgetStartDate: string;
  formattedCustomBudgetEndDate: string;
}

export const CustomBudgetInfo = ({
  customBudgetAmount,
  formattedCustomBudgetStartDate,
  formattedCustomBudgetEndDate
}: CustomBudgetInfoProps) => {
  return (
    <div className="bg-orange-50 p-2 rounded mb-2 text-xs">
      <div className="text-orange-600 font-medium mb-1">Orçamento personalizado ativo</div>
      <div className="flex justify-between">
        <div>
          <span className="text-gray-600">Valor:</span>{" "}
          <span className="font-medium">{formatCurrency(customBudgetAmount || 0)}</span>
        </div>
        <div>
          <span className="text-gray-600">Período:</span>{" "}
          <span className="font-medium">{formattedCustomBudgetStartDate} - {formattedCustomBudgetEndDate}</span>
        </div>
      </div>
    </div>
  );
};
