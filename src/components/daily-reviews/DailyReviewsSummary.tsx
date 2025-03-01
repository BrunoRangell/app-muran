
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { getDaysInMonth } from 'date-fns';

// Função para calcular o orçamento diário ideal
const calculateIdealDailyBudget = (monthlyBudget: number, date: Date) => {
  if (!monthlyBudget) return 0;
  const daysInMonth = getDaysInMonth(date);
  return monthlyBudget / daysInMonth;
};

// Função para gerar recomendação
const generateRecommendation = (currentDaily: number, idealDaily: number) => {
  if (!currentDaily || !idealDaily) return null;
  
  const percentDifference = ((currentDaily - idealDaily) / idealDaily) * 100;
  
  if (percentDifference < -10) {
    return `Aumentar o orçamento diário em ${Math.abs(Math.round(percentDifference))}%`;
  } else if (percentDifference > 10) {
    return `Diminuir o orçamento diário em ${Math.round(percentDifference)}%`;
  } else {
    return "Manter o orçamento diário atual";
  }
};

export const DailyReviewsSummary = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-reviews-summary"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      // Buscamos as revisões de hoje
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select(`
          *,
          clients(company_name, meta_ads_budget)
        `)
        .eq("review_date", today);

      if (reviewsError) throw reviewsError;
      
      // Enriquecemos os dados com cálculos dinâmicos
      const enrichedReviews = reviews.map(review => {
        const idealDaily = calculateIdealDailyBudget(
          review.clients?.meta_ads_budget || 0,
          new Date(review.review_date)
        );
        
        const recommendation = generateRecommendation(
          review.meta_daily_budget_current || 0,
          idealDaily
        );
        
        return {
          ...review,
          idealDailyBudget: idealDaily,
          recommendation
        };
      });
      
      return enrichedReviews;
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
  const increases = data.filter(r => r.recommendation?.includes("Aumentar")).length;
  const decreases = data.filter(r => r.recommendation?.includes("Diminuir")).length;
  const maintains = data.filter(r => r.recommendation?.includes("Manter")).length;

  // Calcular totais
  const totalMonthlyBudget = data.reduce((sum, item) => sum + (item.clients?.meta_ads_budget || 0), 0);
  const totalSpent = data.reduce((sum, item) => sum + (item.meta_total_spent || 0), 0);
  const spentPercentage = totalMonthlyBudget > 0 
    ? Math.min((totalSpent / totalMonthlyBudget) * 100, 100)
    : 0;

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
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-sm text-gray-500">
              de {formatCurrency(totalMonthlyBudget)} disponível
            </p>
            <div className="mt-2 text-sm flex items-center gap-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${spentPercentage}%` }}
                ></div>
              </div>
              <span>
                {Math.round(spentPercentage)}%
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
              <div className="text-2xl font-bold">{increases}</div>
              <div className="text-sm text-gray-500">
                clientes precisam de orçamento maior
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
              <div className="text-2xl font-bold">{decreases}</div>
              <div className="text-sm text-gray-500">
                clientes com orçamento elevado
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Analisados</CardTitle>
            <CardDescription>Clientes revisados hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-sm text-gray-500">
              {maintains} com orçamento adequado
            </p>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};
