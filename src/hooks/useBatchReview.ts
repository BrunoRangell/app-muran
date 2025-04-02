
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useBatchReview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<any>(null);
  const { toast } = useToast();

  // Carregar timestamp da última revisão em lote
  useEffect(() => {
    const loadLastBatchTime = async () => {
      try {
        const { data } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "last_batch_review_time")
          .single();
        
        if (data) {
          setLastBatchReviewTime(data.value);
        }
      } catch (error) {
        console.error("Erro ao carregar timestamp da última análise em lote:", error);
      }
    };

    loadLastBatchTime();
    
    // Verificar progresso a cada 5 segundos
    const intervalId = setInterval(checkBatchProgress, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Função para verificar progresso da análise em lote
  const checkBatchProgress = async () => {
    try {
      const { data } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "batch_review_progress")
        .single();
      
      if (data?.value?.status === "running") {
        setBatchProgress(data.value);
      } else {
        setBatchProgress(null);
      }
    } catch (error) {
      console.error("Erro ao verificar progresso da análise em lote:", error);
    }
  };

  // Função para analisar todos os clientes
  const reviewAllClients = async () => {
    try {
      console.log("[useBatchReview] Iniciando análise em lote");
      setIsLoading(true);
      
      // Chamar a função Edge para iniciar o processamento em lote
      const { data, error } = await supabase.functions.invoke(
        "daily-meta-review",
        {
          body: {
            manual: true,
            executeReview: true
          }
        }
      );
      
      if (error) {
        throw new Error(`Erro ao iniciar análise em lote: ${error.message}`);
      }
      
      // Atualizar o timestamp da última análise em lote para feedback imediato na UI
      const now = new Date().toISOString();
      setLastBatchReviewTime(now);
      
      toast({
        title: "Análise em lote iniciada",
        description: "A análise de todos os clientes foi iniciada em segundo plano.",
      });
      
      // Começar a verificar o progresso
      checkBatchProgress();
      
      return true;
    } catch (err: any) {
      console.error("[useBatchReview] Erro:", err);
      
      toast({
        title: "Erro ao iniciar análise em lote",
        description: err.message || "Não foi possível iniciar a análise em lote",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reviewAllClients,
    lastBatchReviewTime,
    batchProgress,
    isLoading
  };
};
