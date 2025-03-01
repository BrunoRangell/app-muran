
import { formatCurrency } from "@/utils/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientSummaryCardProps {
  client: any;
  latestReview: any;
}

export const ClientSummaryCard = ({ client, latestReview }: ClientSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          {client.company_name}
        </CardTitle>
        <CardDescription>
          Detalhes da revisão mais recente - {latestReview ? new Date(latestReview.review_date).toLocaleDateString("pt-BR") : "Não disponível"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Mensal Meta Ads</div>
            <div className="text-2xl font-bold">{formatCurrency(client.meta_ads_budget || 0)}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">ID da Conta Meta</div>
            <div className="text-lg font-medium">{client.meta_account_id || "Não configurado"}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Gasto</div>
            <div className="text-2xl font-bold">
              {latestReview ? formatCurrency(latestReview.meta_total_spent || 0) : "N/A"}
            </div>
            {client.meta_ads_budget && latestReview?.meta_total_spent && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((latestReview.meta_total_spent / client.meta_ads_budget) * 100)}% do orçamento mensal
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
