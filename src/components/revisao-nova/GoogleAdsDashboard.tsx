
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAdsService } from "./hooks/useGoogleAdsService";
import { supabase } from "@/lib/supabase";
import { GoogleAdsDashboardCard } from "@/components/daily-reviews/dashboard/GoogleAdsDashboardCard";
import { GoogleAdsDashboardHeader } from "@/components/daily-reviews/dashboard/components/GoogleAdsDashboardHeader";

export const GoogleAdsDashboard = () => {
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const { toast } = useToast();
  const { fetchMonthlySpend, isLoading: isApiLoading } = useGoogleAdsService();

  // Buscar a hora da última revisão em lote
  useEffect(() => {
    const fetchLastBatchReview = async () => {
      try {
        const { data, error } = await supabase
          .from('client_current_reviews')
          .select('updated_at')
          .not('google_account_id', 'is', null)
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
    setIsBatchAnalyzing(true);
    
    try {
      // Aqui seria implementada a análise de todos os clientes
      // Similar ao que é feito no ReviewsDashboardCard
      
      toast({
        title: "Análise em lote iniciada",
        description: "A análise de todos os clientes foi iniciada com sucesso.",
      });
      
      // Atualize a hora da última revisão
      setLastBatchReviewTime(new Date());
    } catch (err: any) {
      toast({
        title: "Erro na análise em lote",
        description: err.message || "Ocorreu um erro ao iniciar a análise em lote",
        variant: "destructive",
      });
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <GoogleAdsDashboardHeader 
          lastBatchReviewTime={lastBatchReviewTime}
          isBatchAnalyzing={isBatchAnalyzing}
          isLoading={isApiLoading}
          onAnalyzeAll={handleAnalyzeAll}
        />

        <GoogleAdsDashboardCard onViewClientDetails={() => {}} />
      </div>
    </div>
  );
};
