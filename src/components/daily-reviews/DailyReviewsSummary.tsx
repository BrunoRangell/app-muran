
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export const DailyReviewsSummary = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-reviews-summary"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select(`
          *,
          clients(company_name)
        `)
        .eq("review_date", today);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="h-40">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-amber-500" />
            Nenhuma revisão encontrada para hoje
          </CardTitle>
          <CardDescription>
            Execute análises de clientes para ver o resumo do dia
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Agrupar recomendações
  const metaRecommendations = data.filter(r => r.meta_recommendation);
  const googleRecommendations = data.filter(r => r.google_recommendation);
  
  const metaIncreases = metaRecommendations.filter(r => r.meta_recommendation.includes("Aumentar"));
  const metaDecreases = metaRecommendations.filter(r => r.meta_recommendation.includes("Diminuir"));
  
  const googleIncreases = googleRecommendations.filter(r => r.google_recommendation.includes("Aumentar"));
  const googleDecreases = googleRecommendations.filter(r => r.google_recommendation.includes("Diminuir"));

  // Calcular totais
  const totalMetaBudget = data.reduce((sum, item) => sum + (item.meta_budget_available || 0), 0);
  const totalGoogleBudget = data.reduce((sum, item) => sum + (item.google_budget_available || 0), 0);
  const totalMetaSpent = data.reduce((sum, item) => sum + (item.meta_total_spent || 0), 0);
  const totalGoogleSpent = data.reduce((sum, item) => sum + (item.google_total_spent || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="text-muran-primary" size={20} />
        Resumo de revisões de hoje - {new Date().toLocaleDateString("pt-BR")}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Meta Ads</CardTitle>
            <CardDescription>Orçamento e gasto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMetaSpent)}</div>
            <p className="text-sm text-gray-500">
              de {formatCurrency(totalMetaBudget)} disponível
            </p>
            <div className="mt-2 text-sm flex items-center gap-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (totalMetaSpent / totalMetaBudget) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <span>
                {totalMetaBudget > 0
                  ? Math.round((totalMetaSpent / totalMetaBudget) * 100)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Google Ads</CardTitle>
            <CardDescription>Orçamento e gasto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGoogleSpent)}</div>
            <p className="text-sm text-gray-500">
              de {formatCurrency(totalGoogleBudget)} disponível
            </p>
            <div className="mt-2 text-sm flex items-center gap-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (totalGoogleSpent / totalGoogleBudget) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <span>
                {totalGoogleBudget > 0
                  ? Math.round((totalGoogleSpent / totalGoogleBudget) * 100)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-green-500" size={18} />
              Aumentar orçamento
            </CardTitle>
            <CardDescription>Recomendações de aumento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Meta Ads:</span> {metaIncreases.length} clientes
              </div>
              <div className="text-sm">
                <span className="font-medium">Google Ads:</span> {googleIncreases.length} clientes
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="text-red-500" size={18} />
              Diminuir orçamento
            </CardTitle>
            <CardDescription>Recomendações de redução</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Meta Ads:</span> {metaDecreases.length} clientes
              </div>
              <div className="text-sm">
                <span className="font-medium">Google Ads:</span> {googleDecreases.length} clientes
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-medium mt-6">Clientes analisados hoje ({data.length})</h3>
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 grid grid-cols-12">
          <div className="col-span-4">Cliente</div>
          <div className="col-span-4">Meta Ads</div>
          <div className="col-span-4">Google Ads</div>
        </div>
        {data.map((review) => (
          <div key={review.id} className="border-t hover:bg-gray-50 transition-colors">
            <div className="px-4 py-3 text-sm grid grid-cols-12 items-center">
              <div className="col-span-4 font-medium">{review.clients?.company_name}</div>
              <div className="col-span-4 flex items-center gap-1">
                {review.meta_recommendation?.includes("Aumentar") ? (
                  <TrendingUp className="text-green-500" size={16} />
                ) : review.meta_recommendation?.includes("Diminuir") ? (
                  <TrendingDown className="text-red-500" size={16} />
                ) : (
                  <span>-</span>
                )}
                <span className="truncate">
                  {review.meta_recommendation || "Não disponível"}
                </span>
              </div>
              <div className="col-span-4 flex items-center gap-1">
                {review.google_recommendation?.includes("Aumentar") ? (
                  <TrendingUp className="text-green-500" size={16} />
                ) : review.google_recommendation?.includes("Diminuir") ? (
                  <TrendingDown className="text-red-500" size={16} />
                ) : (
                  <span>-</span>
                )}
                <span className="truncate">
                  {review.google_recommendation || "Não disponível"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
