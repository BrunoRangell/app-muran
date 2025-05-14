
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Link } from 'react-router-dom';

interface ClientCardProps {
  client: {
    id: string;
    company_name: string;
    budget_amount?: number;
    meta_account_id?: string | null;
    meta_account_name?: string | null;
    needsAdjustment?: boolean;
    review?: {
      meta_daily_budget_current?: number | null;
      meta_total_spent?: number | null;
      google_daily_budget_current?: number | null;
      google_total_spent?: number | null;
    } | null;
    budgetCalculation?: {
      idealDailyBudget?: number;
      suggestedChange?: number;
      needsBudgetAdjustment?: boolean;
    }
  };
  platform: 'meta' | 'google';
  onReview: ({ clientId, accountId }: { clientId: string, accountId?: string }) => void;
  isProcessing: boolean;
}

export function ClientCard({ client, platform, onReview, isProcessing }: ClientCardProps) {
  // Determinar qual orçamento e gasto usar com base na plataforma
  const currentBudget = platform === 'meta'
    ? client.review?.meta_daily_budget_current
    : client.review?.google_daily_budget_current;
    
  const totalSpent = platform === 'meta'
    ? client.review?.meta_total_spent
    : client.review?.google_total_spent;
    
  const idealBudget = client.budgetCalculation?.idealDailyBudget || 0;
  const needsAdjustment = client.needsAdjustment || client.budgetCalculation?.needsBudgetAdjustment || false;
  
  // Calcular mudança percentual
  const budgetDifference = (idealBudget - (currentBudget || 0));
  const changePercentage = currentBudget && currentBudget > 0
    ? Math.abs(Math.round((budgetDifference / currentBudget) * 100))
    : 0;
    
  const isIncrease = budgetDifference > 0;
  
  // Função para lidar com clique no botão de revisão
  const handleReview = () => {
    onReview({
      clientId: client.id,
      accountId: platform === 'meta' ? client.meta_account_id || undefined : undefined
    });
  };
  
  const detailsLink = platform === 'meta'
    ? `/clients/${client.id}/meta`
    : `/clients/${client.id}/google`;
    
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base line-clamp-1 font-semibold">
            {client.company_name}
          </CardTitle>
          {needsAdjustment && (
            <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              Ajuste
            </div>
          )}
        </div>
        {client.meta_account_name && (
          <p className="text-xs text-gray-500 -mt-1">
            {client.meta_account_name}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-gray-500">Orçamento</div>
            <div className="font-medium">
              {formatCurrency(client.budget_amount || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Gasto</div>
            <div className="font-medium">
              {formatCurrency(totalSpent || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Atual</div>
            <div className="font-medium">
              {formatCurrency(currentBudget || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Ideal</div>
            <div className="flex items-center font-medium">
              {formatCurrency(idealBudget)}
              {needsAdjustment && (
                isIncrease ? (
                  <TrendingUp className="ml-1 h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="ml-1 h-4 w-4 text-red-500" />
                )
              )}
            </div>
            {needsAdjustment && (
              <div className="text-xs text-gray-500">
                {isIncrease ? '+' : '-'}{changePercentage}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 pt-2 pb-2 flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isProcessing}
          onClick={handleReview}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Analisando...
            </>
          ) : (
            'Analisar'
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1"
        >
          <Link to={detailsLink}>Detalhes</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
