import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader, PlayCircle, AlertTriangle, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { MetaAccount } from "@/components/daily-reviews/hooks/types/accountTypes";
import { ClientInfo } from "../card-components/ClientInfo";

interface ClientReviewCardCompactProps {
  client: ClientWithReview;
  onAnalyzeClient: (clientId: string) => void;
  isAnalyzing: boolean;
  metaAccount?: MetaAccount;
  customBudget: any | null;
  isUsingCustomBudgetInReview: boolean;
}

export const ClientReviewCardCompact = ({
  client,
  onAnalyzeClient,
  isAnalyzing,
  metaAccount,
  customBudget,
  isUsingCustomBudgetInReview
}: ClientReviewCardCompactProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lastReview = client.lastReview;
  const hasReview = !!lastReview;
  const budgetIsUnderperforming = hasReview && lastReview.budget_is_underperforming;
  const budgetIsOverperforming = hasReview && lastReview.budget_is_overperforming;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="bg-white shadow-md rounded-md overflow-hidden">
      <div className="p-4">
        <ClientInfo 
          client={client} 
          metaAccount={metaAccount}
          customBudget={customBudget}
          isUsingCustomBudgetInReview={isUsingCustomBudgetInReview}
        />

        {/* Indicadores de performance */}
        {hasReview && (
          <div className="flex items-center space-x-2 mt-2">
            {budgetIsUnderperforming && (
              <Badge variant="destructive" className="gap-1">
                <TrendingDown size={16} />
                Abaixo do ideal
              </Badge>
            )}
            {budgetIsOverperforming && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none gap-1">
                <TrendingUp size={16} />
                Acima do ideal
              </Badge>
            )}
          </div>
        )}

        {/* Detalhes da última revisão (inicialmente escondidos) */}
        {isExpanded && hasReview && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Orçamento atual:
                </span>
                <p className="text-sm text-gray-900 font-semibold">
                  {formatCurrency(lastReview.meta_daily_budget_current)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Gasto total:
                </span>
                <p className="text-sm text-gray-900 font-semibold">
                  {formatCurrency(lastReview.meta_total_spent)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão de análise e expandir/recolher */}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalyzeClient(client.id)}
            disabled={isAnalyzing}
            className="bg-muran-primary hover:bg-muran-primary/90 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <PlayCircle size={16} className="mr-2" />
                Analisar
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleExpanded}>
            {isExpanded ? "Recolher" : "Expandir"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
