
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BatchReviewInfo {
  lastBatchReviewTime: string;
  details: {
    platform: string;
    successCount: number;
    errorCount: number;
    totalClients: number;
    completedAt: string;
  };
}

export const usePlatformBatchReviews = () => {
  // Buscar a última revisão do Meta Ads
  const { data: lastMetaReview, refetch: refetchMeta } = useQuery({
    queryKey: ['last-batch-review-meta'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      console.log("🔍 Buscando última revisão em massa do Meta Ads...");
      
      const { data } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .or('details->>platform.eq.meta,details->platform.is.null') // Meta ou legado sem platform
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log("📅 Última revisão Meta encontrada:", data);
      
      return data ? {
        lastBatchReviewTime: data.created_at,
        details: (data.details as any) || {}
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Buscar a última revisão do Google Ads
  const { data: lastGoogleReview, refetch: refetchGoogle } = useQuery({
    queryKey: ['last-batch-review-google'],
    queryFn: async (): Promise<BatchReviewInfo | null> => {
      console.log("🔍 Buscando última revisão em massa do Google Ads...");
      
      const { data } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .eq('details->>platform', 'google')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log("📅 Última revisão Google encontrada:", data);
      
      return data ? {
        lastBatchReviewTime: data.created_at,
        details: (data.details as any) || {}
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos
  });

  return {
    lastMetaReviewTime: lastMetaReview?.lastBatchReviewTime || null,
    lastGoogleReviewTime: lastGoogleReview?.lastBatchReviewTime || null,
    metaReviewDetails: lastMetaReview?.details || null,
    googleReviewDetails: lastGoogleReview?.details || null,
    refetchMeta,
    refetchGoogle,
    refetchBoth: () => {
      refetchMeta();
      refetchGoogle();
    }
  };
};

interface UseBatchOperationsProps {
  platform: "meta" | "google";
  onComplete?: () => void;
  onIndividualComplete?: () => void; // NOVO: callback para revisões individuais
}

export const useBatchOperations = ({ platform, onComplete, onIndividualComplete }: UseBatchOperationsProps) => {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentClientName, setCurrentClientName] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateAllQueries = async () => {
    console.log("🔄 Invalidando todas as queries relevantes...");
    
    // Invalidar queries principais
    await queryClient.invalidateQueries({ queryKey: ["improved-meta-reviews"] });
    await queryClient.invalidateQueries({ queryKey: ["improved-google-reviews"] });
    await queryClient.invalidateQueries({ queryKey: ["unified-reviews-data"] });
    await queryClient.invalidateQueries({ queryKey: ["last-batch-review-meta"] });
    await queryClient.invalidateQueries({ queryKey: ["last-batch-review-google"] });
    
    // Invalidar queries do sistema unificado
    await queryClient.invalidateQueries({ queryKey: ["real-time-data"] });
    
    console.log("✅ Queries invalidadas com sucesso");
  };

  const reviewClient = async (clientId: string, accountId?: string) => {
    if (processingIds.includes(clientId)) return;
    
    console.log(`🔍 Iniciando revisão individual do cliente ${clientId} (plataforma: ${platform})`);
    setProcessingIds(prev => [...prev, clientId]);
    
    try {
      let result;
      
      if (platform === "meta") {
        // Chamar função unificada do Meta Ads
        console.log(`📊 Executando unified-meta-review para cliente ${clientId}`);
        const { data, error } = await supabase.functions.invoke("unified-meta-review", {
          body: {
            clientId,
            metaAccountId: accountId,
            reviewDate: new Date().toISOString().split('T')[0]
          }
        });
        
        if (error) throw error;
        result = data;
        
      } else {
        // Chamar Edge Function do Google Ads
        const { data, error } = await supabase.functions.invoke("daily-google-review", {
          body: {
            clientId,
            googleAccountId: accountId,
            reviewDate: new Date().toISOString().split('T')[0],
            fetchRealData: true,
            source: "ui_individual_review"
          }
        });
        
        if (error) throw error;
        result = data;
      }
      
      console.log(`✅ Cliente ${clientId} analisado com sucesso:`, result);
      
      // CORREÇÃO PRINCIPAL: Invalidar queries após revisão individual
      await invalidateAllQueries();
      
      // NOVO: Chamar callback específico para revisões individuais
      if (onIndividualComplete) {
        console.log(`🔄 Executando callback de revisão individual para ${platform}`);
        onIndividualComplete();
      }
      
    } catch (error) {
      console.error(`❌ Erro ao analisar cliente ${clientId}:`, error);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== clientId));
    }
  };

  const reviewAllClients = async (clients: any[]) => {
    if (isProcessing) return;
    
    console.log(`🚀 Iniciando revisão em massa de ${clients.length} clientes (${platform})`);
    setIsProcessing(true);
    setTotal(clients.length);
    setProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Primeira fase: Executar revisões individuais
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        setCurrentClientName(client.company_name || `Cliente ${i + 1}`);
        setProgress(i + 1);
        
        try {
          const accountId = platform === "meta" 
            ? client.meta_account_id 
            : client.google_account_id;
          
          // Executar revisão usando função unificada
          if (platform === "meta") {
            const { data, error } = await supabase.functions.invoke("unified-meta-review", {
              body: {
                clientId: client.id,
                metaAccountId: accountId,
                reviewDate: new Date().toISOString().split('T')[0]
              }
            });
            if (error) throw error;
          } else {
            const { data, error } = await supabase.functions.invoke("daily-google-review", {
              body: {
                clientId: client.id,
                googleAccountId: accountId,
                reviewDate: new Date().toISOString().split('T')[0],
                fetchRealData: true,
                source: "ui_batch_review"
              }
            });
            if (error) throw error;
          }
          
          successCount++;
        } catch (error) {
          console.error(`❌ Erro no cliente ${client.company_name}:`, error);
          errorCount++;
        }
      }
      
      // Não é mais necessário executar atualizações globais separadas
      // A função unified-meta-review já cuida de tudo
      
      // Registrar log da revisão em massa
      await supabase.from('system_logs').insert({
        event_type: 'batch_review_completed',
        message: `Revisão em massa ${platform} concluída`,
        details: {
          platform,
          successCount,
          errorCount,
          totalClients: clients.length,
          completedAt: new Date().toISOString()
        }
      });
      
      // Invalidar queries após revisão em massa
      await invalidateAllQueries();
      
      toast({
        title: "Revisão em massa concluída",
        description: `${successCount} clientes analisados com sucesso, ${errorCount} falhas.`,
      });
      
      if (onComplete) {
        onComplete();
      }
    } finally {
      setIsProcessing(false);
      setCurrentClientName("");
      setProgress(0);
      setTotal(0);
    }
  };

  const cancelBatchProcessing = () => {
    console.log("🛑 Cancelando processamento em massa");
    setIsProcessing(false);
    setProcessingIds([]);
    setCurrentClientName("");
    setProgress(0);
    setTotal(0);
  };

  return {
    processingIds,
    reviewClient,
    reviewAllClients,
    cancelBatchProcessing,
    isProcessing,
    progress,
    total,
    currentClientName
  };
};
