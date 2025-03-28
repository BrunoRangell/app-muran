
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAdsService } from "./hooks/useGoogleAdsService";
import { supabase } from "@/lib/supabase";
import { GoogleAdsDashboardCard } from "@/components/daily-reviews/dashboard/GoogleAdsDashboardCard";
import { GoogleAdsDashboardHeader } from "@/components/daily-reviews/dashboard/components/GoogleAdsDashboardHeader";
import { useGoogleAdsBatchReview } from "@/components/daily-reviews/hooks/useGoogleAdsBatchReview";

export const GoogleAdsDashboard = () => {
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { fetchMonthlySpend, isLoading: isApiLoading } = useGoogleAdsService();
  const { 
    reviewAllClients, 
    isReviewingBatch, 
    processingClients, 
    lastBatchReviewDate 
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <GoogleAdsDashboardHeader 
          lastBatchReviewTime={lastBatchReviewTime}
          isBatchAnalyzing={isReviewingBatch}
          isLoading={isApiLoading}
          onAnalyzeAll={handleAnalyzeAll}
        />

        <div className="mt-6">
          <GoogleAdsDashboardCard onViewClientDetails={() => {}} />
        </div>
      </div>
    </div>
  );
};
