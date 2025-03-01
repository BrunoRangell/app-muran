
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Loader, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ClientReviewDetailsProps {
  clientId: string;
  onBack: () => void;
}

export const ClientReviewDetails = ({ clientId, onBack }: ClientReviewDetailsProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Buscar cliente
  const { data: client } = useQuery({
    queryKey: ["client-detail", clientId],
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

  // Buscar revisão mais recente para o cliente
  const { data: review, isLoading, refetch } = useQuery({
    queryKey: ["client-review", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Caso não tenha revisão, não tratar como erro
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }
      
      return data;
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await supabase.functions.invoke("daily-budget-reviews", {
        body: { method: "analyzeClient", clientId },
      });

      if (response.error) throw new Error(response.error.message);
      
      refetch();
      toast({
        title: "Análise atualizada",
        description: "Os dados do cliente foram analisados novamente com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na atualização",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasMetaData = review?.meta_budget_available > 0;
  const hasGoogleData = review?.google_budget_available > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar análise
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{client?.company_name}</h2>
        <p className="text-gray-500">
          {hasMetaData || hasGoogleData
            ? `Última análise em ${
                review?.review_date
                  ? new Date(review.review_date).toLocaleDateString("pt-BR")
                  : "-"
              }`
            : "Nenhuma análise disponível"}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <Card className="h-64">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </CardContent>
          </Card>
          <Card className="h-64">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {!hasMetaData && !hasGoogleData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="text-amber-500" />
                  Orçamentos não configurados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Este cliente não possui orçamentos de Meta Ads ou Google Ads configurados. 
                  Configure os orçamentos na aba "Configuração".
                </p>
                <Button onClick={() => window.location.href = "/revisoes-diarias?tab=setup"}>
                  Ir para Configuração
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasMetaData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Meta Ads</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-500">Orçamento mensal</div>
                        <div className="text-xl font-bold">
                          {formatCurrency(review?.meta_budget_available || 0)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="text-sm text-gray-500">Gasto até agora</div>
                        <div className="text-lg">
                          {formatCurrency(review?.meta_total_spent || 0)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm flex items-center gap-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((review?.meta_total_spent || 0) / (review?.meta_budget_available || 1)) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span>
                          {Math.round(
                            ((review?.meta_total_spent || 0) / (review?.meta_budget_available || 1)) * 100
                          )}%
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-500">Orçamento diário atual</div>
                        <div className="text-lg">
                          {formatCurrency(review?.meta_daily_budget_current || 0)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="text-sm text-gray-500">Orçamento diário ideal</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(review?.meta_daily_budget_ideal || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-500 mb-1">Recomendação</div>
                      <div 
                        className={`
                          text-lg font-bold flex items-center gap-2 
                          ${review?.meta_recommendation?.includes("Aumentar") ? "text-green-600" : "text-red-600"}
                        `}
                      >
                        {review?.meta_recommendation?.includes("Aumentar") ? (
                          <TrendingUp />
                        ) : (
                          <TrendingDown />
                        )}
                        {review?.meta_recommendation || "Sem recomendação"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasGoogleData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-yellow-600">Google Ads</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-500">Orçamento mensal</div>
                        <div className="text-xl font-bold">
                          {formatCurrency(review?.google_budget_available || 0)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="text-sm text-gray-500">Gasto até agora</div>
                        <div className="text-lg">
                          {formatCurrency(review?.google_total_spent || 0)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm flex items-center gap-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((review?.google_total_spent || 0) / (review?.google_budget_available || 1)) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span>
                          {Math.round(
                            ((review?.google_total_spent || 0) / (review?.google_budget_available || 1)) * 100
                          )}%
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-500">Orçamento diário atual</div>
                        <div className="text-lg">
                          {formatCurrency(review?.google_daily_budget_current || 0)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="text-sm text-gray-500">Orçamento diário ideal</div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(review?.google_daily_budget_ideal || 0)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="text-sm text-gray-500">Média últimos 5 dias</div>
                        <div className="text-lg">
                          {formatCurrency(review?.google_avg_last_five_days || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-500 mb-1">Recomendação</div>
                      <div 
                        className={`
                          text-lg font-bold flex items-center gap-2 
                          ${review?.google_recommendation?.includes("Aumentar") ? "text-green-600" : "text-red-600"}
                        `}
                      >
                        {review?.google_recommendation?.includes("Aumentar") ? (
                          <TrendingUp />
                        ) : (
                          <TrendingDown />
                        )}
                        {review?.google_recommendation || "Sem recomendação"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
