
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ListChecks, Loader } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "./summary/utils";
import { ptBR } from "date-fns/locale";

type RecentReviewsProps = {
  onSelectClient: (clientId: string) => void;
};

export const RecentReviews = ({ onSelectClient }: RecentReviewsProps) => {
  // Buscar revisões recentes
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["recent-reviews"],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("daily_budget_reviews")
        .select(`
          *,
          clients(company_name)
        `)
        .order("review_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return reviews;
    },
  });

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ListChecks className="text-muran-primary" size={20} />
        Revisões Recentes
      </h2>

      {isLoadingReviews ? (
        <div className="rounded-lg border animate-pulse">
          <div className="h-12 bg-gray-100 rounded-t-lg"></div>
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="h-16 border-t bg-white px-4 py-2">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
        </div>
      ) : reviews?.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center justify-center py-6 text-gray-500">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">Nenhuma revisão encontrada</p>
              <p className="text-sm text-gray-400 mt-1">
                Faça uma análise de cliente para ver revisões aqui
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 grid grid-cols-8">
            <div className="col-span-4">Cliente</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-2">Orçamento Diário</div>
          </div>
          {reviews?.map((review) => (
            <div
              key={review.id}
              className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectClient(review.client_id)}
            >
              <div className="px-4 py-3 text-sm grid grid-cols-8 items-center">
                <div className="col-span-4 font-medium">{review.clients?.company_name}</div>
                <div className="col-span-2 text-gray-500">
                  {formatDateInBrasiliaTz(review.review_date, 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  {formatCurrency(review.meta_daily_budget_current || 0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
