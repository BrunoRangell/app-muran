
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Loader, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface ClientReviewDetailsProps {
  clientId: string;
  onBack: () => void;
}

export const ClientReviewDetails = ({ clientId, onBack }: ClientReviewDetailsProps) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Buscar cliente
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar revisões
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["client-reviews", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Selecionar a revisão mais recente por padrão
  const latestReview = reviews && reviews.length > 0 ? reviews[0] : null;
  const review = selectedDate
    ? reviews?.find((r) => r.review_date === selectedDate)
    : latestReview;

  if (isLoadingClient || isLoadingReviews) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader className="h-8 w-8 animate-spin text-muran-primary" />
        <p className="text-muran-dark">Carregando dados da revisão...</p>
      </div>
    );
  }

  if (!client || !latestReview) {
    return (
      <div className="flex flex-col space-y-4">
        <Button variant="outline" onClick={onBack} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Button>
        <Card className="p-6 text-center">
          <p className="text-gray-500">Nenhuma revisão encontrada para este cliente.</p>
          <p className="text-gray-500 mt-2">Configure os orçamentos e execute uma análise.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Button>

        {reviews && reviews.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Revisão de:</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedDate || latestReview.review_date}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {reviews.map((r) => (
                <option key={r.review_date} value={r.review_date}>
                  {new Date(r.review_date).toLocaleDateString("pt-BR")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16 border-2 border-muran-primary">
          <AvatarFallback className="bg-muran-primary text-white text-xl">
            {client.company_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{client.company_name}</h1>
          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              Revisão em {new Date(review?.review_date).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        {/* Meta Ads Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg text-blue-600">
              <div className="flex-shrink-0 w-8 h-8 mr-2 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">M</span>
              </div>
              Meta Ads
            </CardTitle>
            <CardDescription>
              {review?.meta_account_name || "Conta não configurada"}
              {review?.meta_error && (
                <div className="mt-1 text-red-500 text-xs">
                  Erro: {review.meta_error}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Métricas</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">Orçamento mensal</p>
                  <p className="font-semibold">{formatCurrency(review?.meta_budget_available || 0)}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">Gasto até agora</p>
                  <p className="font-semibold">{formatCurrency(review?.meta_total_spent || 0)}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">Orçamento diário atual</p>
                  <p className="font-semibold">{formatCurrency(review?.meta_daily_budget_current || 0)}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">Orçamento diário ideal</p>
                  <p className="font-semibold">{formatCurrency(review?.meta_daily_budget_ideal || 0)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Recomendação</h3>
              <div className="p-3 rounded border flex items-center">
                {review?.meta_recommendation?.includes("Aumentar") ? (
                  <TrendingUp className="mr-2 text-green-500" size={20} />
                ) : review?.meta_recommendation?.includes("Diminuir") ? (
                  <TrendingDown className="mr-2 text-red-500" size={20} />
                ) : (
                  <span className="w-5 h-5 mr-2 rounded-full bg-gray-200"></span>
                )}
                <span className="font-medium">{review?.meta_recommendation || "Não disponível"}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Progresso de gastos</h3>
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {formatCurrency(review?.meta_total_spent || 0)} de{" "}
                    {formatCurrency(review?.meta_budget_available || 0)}
                  </span>
                  <span>
                    {review?.meta_budget_available
                      ? Math.round((review.meta_total_spent / review.meta_budget_available) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        review?.meta_budget_available
                          ? Math.min(
                              (review.meta_total_spent / review.meta_budget_available) * 100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
