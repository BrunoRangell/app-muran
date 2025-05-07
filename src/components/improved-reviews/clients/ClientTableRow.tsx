
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { ChevronRight } from "lucide-react";
import { useBatchOperations } from "../hooks/useBatchOperations";

interface ClientTableRowProps {
  client: any;
  platform: "meta" | "google";
}

export function ClientTableRow({ client, platform }: ClientTableRowProps) {
  const { reviewClient, processingIds } = useBatchOperations({
    platform: platform
  });
  
  const isProcessing = processingIds.includes(client.id);
  
  // Preparar dados para exibição
  const accountName = client[`${platform}_account_name`] || "Conta Principal";
  const dailyBudget = client.budgetCalculation?.dailyBudget || 0;
  const idealBudget = client.budgetCalculation?.idealBudget || 0;
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const needsAdjustment = client.needsAdjustment;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{client.company_name}</p>
          <p className="text-sm text-gray-500">
            {platform === "meta" && accountName ? `CA: ${accountName}` : accountName}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-right">
          {formatCurrency(budgetAmount)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-right">
          {formatCurrency(spentAmount)}
        </div>
      </td>
      <td className="px-4 py-3">
        {needsAdjustment && (
          <Badge className={budgetDifference > 0 ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}>
            {budgetDifference > 0 
              ? `Aumentar ${formatCurrency(budgetDifference)}` 
              : `Reduzir ${formatCurrency(Math.abs(budgetDifference))}`}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <Button 
            size="sm" 
            onClick={() => reviewClient(client.id, client[`${platform}_account_id`])}
            disabled={isProcessing}
            className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
          >
            {isProcessing ? "..." : "Revisar"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
