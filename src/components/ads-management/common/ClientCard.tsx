
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useBatchOperations } from "./hooks/useBatchOperations";
import { PlatformType } from "./types";

interface ClientCardProps {
  client: any;
  platform: PlatformType;
}

export function ClientCard({ client, platform }: ClientCardProps) {
  const { reviewClient, processingIds, isProcessingAccount } = useBatchOperations({
    platform
  });
  
  // Determinar dados específicos da plataforma
  const accountName = client[`${platform}_account_name`] || "Conta Principal";
  const accountId = client[`${platform}_account_id`];
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const needsAdjustment = client.needsAdjustment;
  const currentDailyBudget = client.review?.[`${platform}_daily_budget_current`] || 0;
  const idealDailyBudget = client.budgetCalculation?.idealDailyBudget || 0;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  
  // Verificar estado de processamento
  const isProcessing = processingIds.includes(client.id) || 
    isProcessingAccount(client.id, accountId);

  return (
    <Card className={`overflow-hidden ${needsAdjustment ? 'border-amber-300' : 'border-gray-100'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center">
              {needsAdjustment && <AlertTriangle size={16} className="text-amber-500 mr-1" />}
              <h3 className="font-medium text-gray-800 line-clamp-1">{client.company_name}</h3>
            </div>
            <p className="text-sm text-gray-500">{accountName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Orçamento</div>
            <div className="text-sm font-medium">{formatCurrency(budgetAmount)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Gasto</div>
            <div className="text-sm font-medium">
              {formatCurrency(spentAmount)}
              <span className={`text-xs ml-1 ${
                spentPercentage > 90 ? "text-red-500" :
                spentPercentage > 70 ? "text-amber-500" :
                "text-emerald-500"
              }`}>
                ({Math.round(spentPercentage)}%)
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Diário Atual</div>
            <div className="text-sm font-medium">{formatCurrency(currentDailyBudget)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Diário Ideal</div>
            <div className="text-sm font-medium">{formatCurrency(idealDailyBudget)}</div>
          </div>
        </div>
        
        {needsAdjustment && (
          <div className="mt-3 p-2 bg-amber-50 rounded-md border border-amber-100">
            <div className="flex items-center">
              {budgetDifference > 0 ? (
                <TrendingUp size={14} className="text-green-500 mr-1" />
              ) : (
                <TrendingDown size={14} className="text-red-500 mr-1" />
              )}
              <span className="text-xs">
                Ajuste recomendado: <span className="font-medium">{formatCurrency(Math.abs(budgetDifference))}</span> 
                {budgetDifference > 0 ? ' a mais' : ' a menos'} por dia
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button
          variant="default"
          size="sm"
          className="bg-[#ff6e00] hover:bg-[#ff6e00]/90 w-full"
          onClick={() => reviewClient(client.id, accountId)}
          disabled={isProcessing}
        >
          {isProcessing ? "Processando..." : "Revisar"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
