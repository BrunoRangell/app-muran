
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { Loader, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { UnifiedClientData } from "../hooks/useUnifiedReviewsData";

interface ClientCardProps {
  client: UnifiedClientData;
  onReview: (clientId: string, metaAccountId?: string) => void;
  isProcessing: boolean;
  platform: "meta" | "google";
}

export function ClientCard({ client, onReview, isProcessing, platform }: ClientCardProps) {
  const handleReview = () => {
    if (platform === "meta") {
      onReview(client.id, client.meta_account_id || undefined);
    } else {
      onReview(client.id, client.google_account_id || undefined);
    }
  };

  const getBudgetStatus = () => {
    if (!client.budgetCalculation) return "unknown";
    
    const { needsBudgetAdjustment, adjustmentType } = client.budgetCalculation;
    
    if (!needsBudgetAdjustment) return "ok";
    return adjustmentType || "unknown";
  };

  const getStatusIcon = () => {
    const status = getBudgetStatus();
    
    switch (status) {
      case "increase":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "decrease":
        return <ArrowDown className="h-4 w-4 text-blue-500" />;
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    const status = getBudgetStatus();
    
    switch (status) {
      case "increase":
        return <Badge variant="destructive">Aumentar</Badge>;
      case "decrease":
        return <Badge variant="secondary">Diminuir</Badge>;
      case "ok":
        return <Badge variant="default" className="bg-green-100 text-green-800">OK</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  // Obter dados específicos da plataforma
  const platformData = platform === "meta" ? {
    totalSpent: client.review?.meta_total_spent || 0,
    currentBudget: client.review?.meta_daily_budget_current || 0,
    accountName: client.meta_account_name || "Conta Principal"
  } : {
    totalSpent: client.review?.google_total_spent || 0,
    currentBudget: client.review?.google_daily_budget_current || 0,
    accountName: client.google_account_name || "Conta Principal"
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon()}
            {client.company_name}
          </CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-gray-600">{platformData.accountName}</p>
        {client.isUsingCustomBudget && (
          <Badge variant="outline" className="w-fit">
            Orçamento Personalizado
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Orçamento Mensal</p>
            <p className="text-lg font-semibold text-muran-primary">
              {formatCurrency(client.budget_amount || 0)}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Gasto Total</p>
            <p className="text-lg font-semibold">
              {formatCurrency(platformData.totalSpent)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Orçamento Atual</p>
            <p className="text-lg font-semibold">
              {formatCurrency(platformData.currentBudget)}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Recomendado</p>
            <p className="text-lg font-semibold text-muran-primary">
              {client.budgetCalculation 
                ? formatCurrency(client.budgetCalculation.recommendedDailyBudget)
                : formatCurrency(0)
              }
            </p>
          </div>
        </div>

        {/* Mostrar diagnóstico se dados estão zerados */}
        {platformData.totalSpent === 0 && platformData.currentBudget === 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Dados não disponíveis - usando valores zerados
            </span>
          </div>
        )}
        
        <Button
          onClick={handleReview}
          disabled={isProcessing}
          className="w-full bg-muran-primary hover:bg-muran-primary/90"
        >
          {isProcessing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            `Revisar ${platform === "meta" ? "Meta" : "Google"}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
