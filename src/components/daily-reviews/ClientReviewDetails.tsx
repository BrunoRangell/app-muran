
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, BarChart3, Loader, Calendar, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { getDaysInMonth } from 'date-fns';
import { ErrorState } from "@/components/clients/components/ErrorState";

interface ClientReviewDetailsProps {
  clientId: string;
  onBack: () => void;
}

export const ClientReviewDetails = ({ clientId, onBack }: ClientReviewDetailsProps) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number | null>(null);

  // Buscar dados do cliente
  const { data: client, isLoading: isLoadingClient, error: clientError } = useQuery({
    queryKey: ["client-detail", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar cliente:", error);
        throw error;
      }
      return data;
    },
  });

  // Buscar a revisão mais recente
  const { data: latestReview, isLoading: isLoadingReview, error: reviewError } = useQuery({
    queryKey: ["latest-review", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar revisão mais recente:", error);
        throw error;
      }
      return data;
    },
    enabled: !!client,
  });

  // Histórico de revisões
  const { data: reviewHistory, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ["review-history", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Erro ao buscar histórico de revisões:", error);
        throw error;
      }
      return data;
    },
    enabled: !!client,
  });

  // Calcular orçamento diário ideal quando o cliente for carregado
  useEffect(() => {
    if (client?.meta_ads_budget) {
      const daysInMonth = getDaysInMonth(new Date());
      const idealDaily = client.meta_ads_budget / daysInMonth;
      setIdealDailyBudget(idealDaily);

      if (latestReview?.meta_daily_budget_current) {
        const percentDifference = ((latestReview.meta_daily_budget_current - idealDaily) / idealDaily) * 100;
        
        if (percentDifference < -10) {
          setRecommendation(`Aumentar o orçamento diário em ${Math.abs(Math.round(percentDifference))}%`);
        } else if (percentDifference > 10) {
          setRecommendation(`Diminuir o orçamento diário em ${Math.round(percentDifference)}%`);
        } else {
          setRecommendation("Manter o orçamento diário atual");
        }
      }
    }
  }, [client, latestReview]);

  // Gerar icone com base na recomendação
  const getRecommendationIcon = () => {
    if (!recommendation) return null;
    
    if (recommendation.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={18} />;
    } else if (recommendation.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={18} />;
    }
    return null;
  };

  const isLoading = isLoadingClient || isLoadingReview;
  const hasError = clientError || reviewError || historyError;

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onBack} className="flex gap-1">
            <ArrowLeft size={16} />
            Voltar
          </Button>
        </div>
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="flex gap-1">
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin mr-2" />
          <span>Carregando detalhes do cliente...</span>
        </div>
      ) : !client ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
              <p className="text-center text-gray-500">Cliente não encontrado.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Orçamento Diário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Atual</div>
                        <div className="text-xl font-bold">
                          {latestReview ? formatCurrency(latestReview.meta_daily_budget_current || 0) : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Ideal</div>
                        <div className="text-xl font-bold text-gray-600">
                          {idealDailyBudget ? formatCurrency(idealDailyBudget) : "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-muran-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center gap-2">
                      Recomendação
                      {getRecommendationIcon()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium">
                      {recommendation || "Não há recomendação disponível"}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Baseado no orçamento mensal configurado
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {isLoadingHistory ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="text-muran-primary" size={18} />
                  Histórico de Revisões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-md"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : reviewHistory && reviewHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="text-muran-primary" size={18} />
                  Histórico de Revisões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Data</th>
                        <th className="pb-2">Orçamento Diário</th>
                        <th className="pb-2">Total Gasto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewHistory.map((review) => (
                        <tr key={review.id} className="border-b">
                          <td className="py-2">
                            {new Date(review.review_date).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2">
                            {formatCurrency(review.meta_daily_budget_current || 0)}
                          </td>
                          <td className="py-2">
                            {formatCurrency(review.meta_total_spent || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="text-muran-primary" size={18} />
                  Histórico de Revisões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                  <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
                  <p>Nenhuma revisão encontrada para este cliente</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
