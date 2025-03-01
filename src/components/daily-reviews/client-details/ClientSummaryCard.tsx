
import { formatCurrency } from "@/utils/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface ClientSummaryCardProps {
  client: any;
  latestReview: any;
}

export const ClientSummaryCard = ({ client, latestReview }: ClientSummaryCardProps) => {
  // Formatar a data da revisão no formato brasileiro
  const formatReviewDate = (dateString?: string) => {
    if (!dateString) return "Não disponível";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dateString;
    }
  };

  // Calcular a porcentagem do orçamento mensal gasto
  const calculateBudgetPercentage = () => {
    if (!client?.meta_ads_budget || !latestReview?.meta_total_spent) return 0;
    
    const budget = Number(client.meta_ads_budget);
    const spent = Number(latestReview.meta_total_spent);
    
    if (budget <= 0) return 0;
    return Math.round((spent / budget) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          {client?.company_name || "Cliente"}
        </CardTitle>
        <CardDescription>
          Detalhes da revisão mais recente - {latestReview ? formatReviewDate(latestReview.review_date) : "Não disponível"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Mensal Meta Ads</div>
            <div className="text-2xl font-bold">{formatCurrency(Number(client?.meta_ads_budget) || 0)}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">ID da Conta Meta</div>
            <div className="text-lg font-medium">{client?.meta_account_id || "Não configurado"}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Gasto</div>
            <div className="text-2xl font-bold">
              {latestReview ? formatCurrency(Number(latestReview.meta_total_spent) || 0) : "N/A"}
            </div>
            {client?.meta_ads_budget && latestReview?.meta_total_spent && (
              <div className="text-xs text-gray-500 mt-1">
                {calculateBudgetPercentage()}% do orçamento mensal
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
