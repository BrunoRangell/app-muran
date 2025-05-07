
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useBatchOperations } from "../hooks/useBatchOperations";

interface ClientListItemProps {
  client: any;
  platform: "meta" | "google";
}

export function ClientListItem({ client, platform }: ClientListItemProps) {
  const { reviewClient, processingIds } = useBatchOperations({
    platform: platform
  });
  
  const isProcessing = processingIds.includes(client.id);
  
  // Preparar dados para exibição
  const accountName = client[`${platform}_account_name`] || "Conta Principal";
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const needsAdjustment = client.needsAdjustment;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  
  return (
    <Card className={`transition-all ${needsAdjustment ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="font-medium">{client.company_name}</h4>
            <p className="text-xs text-gray-500">
              {platform === "meta" && accountName ? `CA: ${accountName}` : accountName}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm text-gray-600">
                {formatCurrency(spentAmount)} / {formatCurrency(budgetAmount)}
              </div>
              
              {needsAdjustment && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
                </div>
              )}
            </div>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => reviewClient(client.id, client[`${platform}_account_id`])}
              disabled={isProcessing}
              className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
            >
              {isProcessing ? "..." : "Revisar"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
