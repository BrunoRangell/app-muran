
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientsGridV2 } from "../clients/ClientsGridV2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, AlertCircle, BarChart2 } from "lucide-react";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { useBatchOperationsV2 } from "../hooks/useBatchOperationsV2";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
}

export function GoogleAdsTabV2({ onRefreshCompleted }: GoogleAdsTabProps) {
  const { toast } = useToast();
  const [modalClientId, setModalClientId] = useState<string | null>(null);

  // Buscar clientes com contas de Google Ads
  const {
    data: clients,
    isLoading: isLoadingClients,
    refetch,
  } = useQuery({
    queryKey: ["clients-with-reviews-google-v2"],
    queryFn: async () => {
      // Consultar clientes ativos com contas Google Ads
      const { data, error } = await supabase
        .from("clients")
        .select("*, google_accounts:client_google_accounts(*), google_reviews:google_ads_reviews(*)")
        .eq("status", "active")
        .not("google_account_id", "is", null)
        .order("company_name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar clientes Google Ads:", error);
        throw new Error("Não foi possível carregar os clientes Google Ads");
      }

      // Processar os dados para extrair a última revisão para cada cliente
      return data.map((client) => {
        // Ordenar revisões pela data (mais recente primeiro)
        const sortedReviews = client.google_reviews
          ? [...client.google_reviews].sort(
              (a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime()
            )
          : [];

        const lastReview = sortedReviews[0] || null;
        
        // Adaptando para o formato ClientWithReview
        const adaptedClient = {
          ...client,
          lastReview: lastReview,
          // Adicionar campos necessários para a tipagem
          needsBudgetAdjustment: lastReview
            ? Math.abs(
                (lastReview.google_daily_budget_current || 0) -
                  calculateIdealDailyBudget(
                    lastReview.using_custom_budget
                      ? lastReview.custom_budget_amount || client.google_ads_budget
                      : client.google_ads_budget,
                    lastReview.google_total_spent || 0
                  )
              ) >= 5
            : false,
        } as unknown as ClientWithReview;
        
        return adaptedClient;
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Configurar hook para operações em lote
  const {
    reviewClient,
    reviewAllClients,
    isProcessing,
    processingIds,
    progress,
    total,
  } = useBatchOperationsV2({
    platform: "google",
    onComplete: () => {
      refetch();
      if (onRefreshCompleted) {
        onRefreshCompleted();
      }
    },
  });

  // Função para revisar todos os clientes
  const handleReviewAll = (selectedClients?: ClientWithReview[]) => {
    const clientsToReview = selectedClients || clients;
    if (!clientsToReview || clientsToReview.length === 0) {
      toast({
        title: "Nenhum cliente para revisar",
        description: "Não há clientes disponíveis para revisão.",
      });
      return;
    }
    
    // Confirmar antes de processar muitos clientes
    if (clientsToReview.length > 5) {
      if (!confirm(`Revisar ${clientsToReview.length} clientes? Isso pode levar alguns minutos.`)) {
        return;
      }
    }
    
    reviewAllClients(clientsToReview);
  };

  // Função para ver detalhes do cliente
  const handleViewDetails = (clientId: string) => {
    setModalClientId(clientId);
    // Implementar lógica para exibir detalhes do cliente
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Visualização de detalhes do cliente será implementada em breve.",
    });
  };

  // Função para calcular orçamento diário ideal
  function calculateIdealDailyBudget(budgetAmount: number, totalSpent: number): number {
    const currentDate = new Date();
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;

    const idealDailyBudget = remainingDays > 0
      ? (budgetAmount - totalSpent) / remainingDays
      : 0;

    // Arredondar para duas casas decimais
    return Math.round(idealDailyBudget * 100) / 100;
  }

  return (
    <div className="space-y-6">
      {/* Resumo e estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de clientes</p>
              {isLoadingClients ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <p className="text-2xl font-semibold">{clients?.length || 0}</p>
              )}
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <BarChart2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Precisam de ajuste</p>
              {isLoadingClients ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <p className="text-2xl font-semibold">
                  {clients?.filter(c => c.needsBudgetAdjustment).length || 0}
                </p>
              )}
            </div>
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de ações */}
      <div className="flex flex-wrap justify-between items-center gap-2 bg-white p-4 rounded-md shadow-sm">
        <h2 className="text-lg font-medium">
          Contas Google Ads
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoadingClients}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingClients ? "animate-spin" : ""}`} />
            Atualizar lista
          </Button>
          <Button
            onClick={() => handleReviewAll()}
            disabled={isProcessing || !clients?.length}
            className="bg-[#ff6e00] hover:bg-[#e66200]"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {progress}/{total} Processando...
              </>
            ) : (
              "Revisar todos"
            )}
          </Button>
        </div>
      </div>

      {/* Grid de clientes */}
      <ClientsGridV2
        clients={clients || []}
        platform="google"
        processingIds={processingIds}
        isLoadingClients={isLoadingClients}
        onReviewClient={reviewClient}
        onReviewAll={handleReviewAll}
        onViewDetails={handleViewDetails}
        isProcessingAll={isProcessing}
      />
    </div>
  );
}
