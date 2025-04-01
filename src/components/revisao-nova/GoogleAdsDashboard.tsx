
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAdsService } from "./hooks/useGoogleAdsService";
import { supabase } from "@/lib/supabase";
import { GoogleAdsDashboardCard } from "@/components/daily-reviews/dashboard/GoogleAdsDashboardCard";
import { GoogleAdsDashboardHeader } from "@/components/daily-reviews/dashboard/components/GoogleAdsDashboardHeader";
import { useGoogleAdsBatchReview } from "@/components/daily-reviews/hooks/useGoogleAdsBatchReview";
import { AnalysisProgress } from "@/components/daily-reviews/dashboard/components/AnalysisProgress";

export const GoogleAdsDashboard = () => {
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const { toast } = useToast();
  const { fetchMonthlySpend, isLoading: isApiLoading } = useGoogleAdsService();
  const { 
    reviewAllClients, 
    isReviewingBatch, 
    processingClients, 
    lastBatchReviewDate,
    clientsWithGoogleAdsId
  } = useGoogleAdsBatchReview();

  // Usar a data de revisão em lote do hook
  useEffect(() => {
    if (lastBatchReviewDate) {
      setLastBatchReviewTime(new Date(lastBatchReviewDate));
    }
  }, [lastBatchReviewDate]);

  // Buscar a hora da última revisão em lote ao iniciar
  useEffect(() => {
    const fetchLastBatchReview = async () => {
      try {
        const { data, error } = await supabase
          .from('google_ads_reviews')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        
        if (data && data.length > 0 && data[0].updated_at) {
          setLastBatchReviewTime(new Date(data[0].updated_at));
        }
      } catch (err) {
        console.error("Erro ao buscar última revisão em lote:", err);
      }
    };

    fetchLastBatchReview();
  }, []);

  // Calcular variáveis de progresso com base nas informações disponíveis
  const batchProgress = isReviewingBatch ? clientsWithGoogleAdsId.length - processingClients.length : 0;
  const totalClientsToAnalyze = clientsWithGoogleAdsId.length;
  const progressPercentage = totalClientsToAnalyze > 0 && isReviewingBatch
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;

  const handleAnalyzeAll = async () => {
    try {
      // Usar o método do hook para analisar todos os clientes
      await reviewAllClients();
      
      toast({
        title: "Análise em lote iniciada",
        description: "A análise de todos os clientes foi iniciada com sucesso.",
      });
      
      // Atualizar a hora da última revisão
      setLastBatchReviewTime(new Date());
    } catch (err: any) {
      toast({
        title: "Erro na análise em lote",
        description: err.message || "Ocorreu um erro ao iniciar a análise em lote",
        variant: "destructive",
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewModeChange = (value: string) => {
    if (value) setViewMode(value);
  };

  return (
    <div className="space-y-6">
      {/* Card de cabeçalho do dashboard com todos os controles */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <GoogleAdsDashboardHeader 
          lastBatchReviewTime={lastBatchReviewTime}
          isBatchAnalyzing={isReviewingBatch}
          isLoading={isApiLoading}
          onAnalyzeAll={handleAnalyzeAll}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showOnlyAdjustments={showOnlyAdjustments}
          onShowOnlyAdjustmentsChange={setShowOnlyAdjustments}
        />

        {/* Adicionar barra de progresso quando estiver analisando */}
        {isReviewingBatch && (
          <div className="mt-4">
            <AnalysisProgress 
              isBatchAnalyzing={isReviewingBatch}
              batchProgress={batchProgress}
              totalClientsToAnalyze={totalClientsToAnalyze}
              progressPercentage={progressPercentage}
            />
          </div>
        )}
      </div>

      {/* Card separado para os clientes */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <GoogleAdsDashboardCard 
          onViewClientDetails={() => {}}
          searchQuery={searchQuery}
          viewMode={viewMode}
          showOnlyAdjustments={showOnlyAdjustments}
        />
      </div>
    </div>
  );
};
