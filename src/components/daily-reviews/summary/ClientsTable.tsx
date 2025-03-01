
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface ReviewData {
  id: string;
  clients: {
    company_name: string;
    meta_ads_budget: number;
  };
  meta_daily_budget_current: number;
  idealDailyBudget: number;
  recommendation: string | null;
}

interface ClientsTableProps {
  data: ReviewData[];
}

export const ClientsTable = ({ data }: ClientsTableProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      <h3 className="text-lg font-medium mt-6">Clientes analisados hoje ({data.length})</h3>
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 grid grid-cols-12">
          <div className="col-span-4">Cliente</div>
          <div className="col-span-2">Orçamento Mensal</div>
          <div className="col-span-2">Orçamento Diário</div>
          <div className="col-span-2">Ideal Diário</div>
          <div className="col-span-2">Recomendação</div>
        </div>
        {data.map((review) => (
          <div key={review.id} className="border-t hover:bg-gray-50 transition-colors">
            <div className="px-4 py-3 text-sm grid grid-cols-12 items-center">
              <div className="col-span-4 font-medium">{review.clients?.company_name}</div>
              <div className="col-span-2">{formatCurrency(review.clients?.meta_ads_budget || 0)}</div>
              <div className="col-span-2">{formatCurrency(review.meta_daily_budget_current || 0)}</div>
              <div className="col-span-2">{formatCurrency(review.idealDailyBudget || 0)}</div>
              <div className="col-span-2 flex items-center gap-1">
                {review.recommendation?.includes("Aumentar") ? (
                  <TrendingUp className="text-green-500" size={16} />
                ) : review.recommendation?.includes("Diminuir") ? (
                  <TrendingDown className="text-red-500" size={16} />
                ) : (
                  <span>-</span>
                )}
                <span className="truncate">
                  {review.recommendation?.split(' ')[0] || "Não disponível"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
