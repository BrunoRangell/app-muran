
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAdsService } from "./hooks/useGoogleAdsService";
import { supabase } from "@/lib/supabase";
import { useBatchOperations } from "@/components/improved-reviews/hooks/useBatchOperations";
import { AnalysisProgress } from "@/components/daily-reviews/dashboard/components/AnalysisProgress";

export const GoogleAdsDashboard = () => {
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const { toast } = useToast();
  const { fetchMonthlySpend, isLoading: isApiLoading } = useGoogleAdsService();
  
  // Usar o hook unificado de batch operations
  const { 
    reviewAllClients,
    isProcessing: isReviewingBatch,
    progress,
    total,
    currentClientName
  } = useBatchOperations({
    platform: "google",
    onComplete: async () => {
      console.log("✅ Revisão em lote do Google Ads concluída");
      setLastBatchReviewTime(new Date());
    }
  });

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

  // Calcular variáveis de progresso
  const batchProgress = isReviewingBatch ? progress : 0;
  const totalClientsToAnalyze = total;
  const progressPercentage = totalClientsToAnalyze > 0 && isReviewingBatch
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;

  const handleAnalyzeAllAction = async () => {
    try {
      // VERIFICAR: Este método pode precisar ser adaptado para funcionar com dados específicos do Google Ads
      await reviewAllClients([]);
      
      toast({
        title: "Análise em lote iniciada",
        description: "A análise de todos os clientes foi iniciada com sucesso.",
      });
      
      setLastBatchReviewTime(new Date());
    } catch (err: any) {
      toast({
        title: "Erro na análise em lote",
        description: err.message || "Ocorreu um erro ao iniciar a análise em lote",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de cabeçalho do dashboard com todos os controles */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#321e32] mb-2">Google Ads Dashboard</h2>
          <div className="flex justify-between items-center">
            <div>
              {lastBatchReviewTime && (
                <p className="text-sm text-gray-500">
                  Última revisão: {lastBatchReviewTime.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <button
              onClick={handleAnalyzeAllAction}
              disabled={isReviewingBatch || isApiLoading}
              className="bg-[#ff6e00] hover:bg-[#e66300] text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isReviewingBatch ? "Analisando..." : "Analisar Todos"}
            </button>
          </div>
        </div>

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

      {/* Placeholder para cards de clientes - será implementado conforme necessário */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <p className="text-gray-500">Cards de clientes Google Ads serão renderizados aqui</p>
      </div>
    </div>
  );
};
