
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Building2, ChevronRight, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ClientCardProps {
  client: any;
  platform?: "meta" | "google";
}

export function ClientCard({ client, platform = "meta" }: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const { reviewClient, processingIds } = useBatchOperations({
    platform: platform as "meta" | "google"
  });
  
  const isProcessing = processingIds.includes(client.id);
  
  // Preparar dados para exibição
  const accountName = client[`${platform}_account_name`] || "Conta Principal";
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const needsAdjustment = client.needsAdjustment;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  
  // Dados para recomendação baseada na média dos últimos 5 dias
  const lastFiveDaysAvg = client.lastFiveDaysAvg || 0;
  const budgetDifferenceAvg = client.budgetCalculation?.budgetDifferenceBasedOnAverage || 0;
  const needsAdjustmentBasedOnAverage = client.budgetCalculation?.needsAdjustmentBasedOnAverage || false;
  
  const handleReviewClick = async () => {
    try {
      await reviewClient(client.id, client[`${platform}_account_id`]);
      toast({
        title: "Revisão completa",
        description: `O orçamento de ${client.company_name} foi revisado com sucesso.`
      });
    } catch (error: any) {
      toast({
        title: "Erro na revisão",
        description: error.message || "Ocorreu um erro ao revisar o cliente",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className={`overflow-hidden transition-all ${needsAdjustment ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-medium line-clamp-1 flex items-center gap-1">
              <Building2 className="h-4 w-4 text-[#ff6e00]" />
              {client.company_name}
            </h3>
            <p className="text-sm text-gray-500">{accountName}</p>
          </div>
          {needsAdjustment && (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gasto</span>
              <span className="font-medium">{formatCurrency(spentAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Orçamento</span>
              <span className="font-medium">{formatCurrency(budgetAmount)}</span>
            </div>
            <Progress 
              value={spentPercentage} 
              className="h-2"
              indicatorClassName={`${
                spentPercentage > 90 
                  ? "bg-red-500" 
                  : spentPercentage > 70 
                  ? "bg-amber-500" 
                  : "bg-emerald-500"
              }`}
            />
            <div className="text-xs text-right text-gray-500">
              {Math.round(spentPercentage)}% utilizado
            </div>
          </div>
          
          {/* Recomendação baseada no orçamento diário atual */}
          {client.budgetCalculation?.needsBudgetAdjustment && (
            <div className={`flex items-center gap-2 text-sm font-medium p-2 rounded ${
              budgetDifference > 0 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {budgetDifference > 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              Recomendado: {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
            </div>
          )}
          
          {/* Nova recomendação baseada na média dos últimos 5 dias */}
          {needsAdjustmentBasedOnAverage && (
            <div className={`flex items-center gap-2 text-sm font-medium p-2 rounded ${
              budgetDifferenceAvg > 0 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-orange-50 text-orange-700'
            }`}>
              <Clock size={16} />
              Média 5d ({formatCurrency(lastFiveDaysAvg)}): {budgetDifferenceAvg > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifferenceAvg))}
            </div>
          )}
          
          {expanded && client.review && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Orçamento diário atual</span>
                <span className="font-medium">{formatCurrency(client.review[`${platform}_daily_budget_current`] || 0)}</span>
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
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? "Menos detalhes" : "Mais detalhes"}
        </Button>
        
        <Button 
          variant="default"
          size="sm"
          className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
          onClick={handleReviewClick}
          disabled={isProcessing}
        >
          {isProcessing ? "Processando..." : "Revisar"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
