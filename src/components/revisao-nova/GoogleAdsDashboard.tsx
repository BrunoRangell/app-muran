
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAdsService } from "./hooks/useGoogleAdsService";
import { supabase } from "@/lib/supabase";
import { useBatchOperations } from "@/components/improved-reviews/hooks/useBatchOperations";
import { AnalysisProgress } from "@/components/daily-reviews/dashboard/components/AnalysisProgress";
import { useGoogleAdsData } from "@/components/improved-reviews/hooks/useGoogleAdsData";
import { ClientsList } from "@/components/improved-reviews/clients/ClientsList";
import { FilterBar } from "@/components/improved-reviews/filters/FilterBar";
import { MetricsPanel } from "@/components/improved-reviews/dashboard/MetricsPanel";

export const GoogleAdsDashboard = () => {
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [showWithoutAccount, setShowWithoutAccount] = useState(false);
  const { toast } = useToast();
  const { fetchMonthlySpend, isLoading: isApiLoading } = useGoogleAdsService();
  
  // Usar dados unificados do Google Ads
  const { data, isLoading, error, metrics, refreshData } = useGoogleAdsData();
  
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
      await refreshData();
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

  const handleAnalyzeAllAction = async () => {
    try {
      if (data && data.length > 0) {
        await reviewAllClients(data);
      }
      
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

  const handleRefresh = async () => {
    console.log("🔄 Atualizando dados do Google Ads...");
    await refreshData();
  };

  // Handlers para filtros
  const handleSearchChange = (query: string) => setSearchQuery(query);
  const handleViewModeChange = (mode: "cards" | "table" | "list") => setViewMode(mode);
  const handleAdjustmentFilterChange = (showAdjustments: boolean) => setShowOnlyAdjustments(showAdjustments);
  const handleAccountFilterChange = (showWithoutAccount: boolean) => setShowWithoutAccount(showWithoutAccount);

  return (
    <div className="space-y-6">
      {/* Painel de métricas unificado */}
      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleAnalyzeAllAction}
        isProcessing={isReviewingBatch}
        progress={progress}
        total={total}
        currentClientName={currentClientName}
        platform="google"
      />
      
      {/* Barra de filtros unificada */}
      <FilterBar 
        searchQuery={searchQuery}
        viewMode={viewMode}
        showOnlyAdjustments={showOnlyAdjustments}
        showWithoutAccount={showWithoutAccount}
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        onAdjustmentFilterChange={handleAdjustmentFilterChange}
        onAccountFilterChange={handleAccountFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        platform="google"
      />
      
      {/* Lista de clientes unificada */}
      <ClientsList 
        data={data}
        viewMode={viewMode}
        searchQuery={searchQuery}
        showOnlyAdjustments={showOnlyAdjustments}
        showWithoutAccount={showWithoutAccount}
        platform="google"
      />
    </div>
  );
};
