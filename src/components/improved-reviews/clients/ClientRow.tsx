
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useBatchOperations } from "../hooks/useBatchOperations";

interface ClientRowProps {
  client: any;
  platform?: "meta" | "google";
}

export function ClientRow({ client, platform = "meta" }: ClientRowProps) {
  const { reviewClient, processingIds, isProcessingAccount } = useBatchOperations({
    platform: platform as "meta" | "google"
  });
  
  const isProcessing = processingIds.includes(client.id) || 
    isProcessingAccount(client.id, client[`${platform}_account_id`]);
  
  // Preparar dados para exibição
  const accountName = client[`${platform}_account_name`] || "Conta Principal";
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const needsAdjustment = client.needsAdjustment;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  
  return (
    <Card className={`overflow-hidden transition-all ${needsAdjustment ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <div className="font-medium line-clamp-1">{client.company_name}</div>
            <div className="text-xs text-gray-500">{accountName}</div>
          </div>
          
          <div className="hidden md:block w-72">
            <div className="flex justify-between text-sm mb-1">
              <span>{formatCurrency(spentAmount)} de {formatCurrency(budgetAmount)}</span>
              <span>{Math.round(spentPercentage)}%</span>
            </div>
            <Progress 
              value={spentPercentage} 
              className="h-2"
              indicatorClassName={`${
                spentPercentage > 90 ? "bg-red-500" : 
                spentPercentage > 70 ? "bg-amber-500" : 
                "bg-emerald-500"
              }`}
            />
          </div>
          
          {needsAdjustment && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
              </span>
            </div>
          )}
        </div>
        
        <Button
          variant="default"
          size="sm"
          className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
          onClick={() => reviewClient(client.id, client[`${platform}_account_id`])}
          disabled={isProcessing}
        >
          {isProcessing ? "..." : "Revisar"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
