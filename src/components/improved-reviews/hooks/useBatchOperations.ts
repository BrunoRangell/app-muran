
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
    await queryClient.invalidateQueries({ queryKey: ["google-ads-clients-data"] });
    await queryClient.invalidateQueries({ queryKey: ["unified-reviews-data"] });
    await queryClient.invalidateQueries({ queryKey: ["last-batch-review-meta"] });
    await queryClient.invalidateQueries({ queryKey: ["last-batch-review-google"] });
    
    // Invalidar queries do sistema unificado
    await queryClient.invalidateQueries({ queryKey: ["real-time-data"] });
    
    console.log("✅ Queries invalidadas com sucesso");
  };

  const reviewClient = async (clientId: string, accountId?: string): Promise<{ success: boolean; reason?: string }> => {
    if (processingIds.includes(clientId)) return { success: false, reason: "already_processing" };
    
    // Validar se accountId existe para evitar chamadas inválidas
    if (!accountId) {
      console.warn(`⚠️ Cliente ${clientId} não tem conta ${platform} cadastrada. Pulando revisão.`);
      toast({
        title: "Conta não encontrada",
        description: `Este cliente não possui conta ${platform === "meta" ? "Meta Ads" : "Google Ads"} cadastrada.`,
        variant: "destructive"
      });
      return { success: false, reason: "no_account" };
    }
    
    console.log(`🔍 Iniciando revisão individual do cliente ${clientId} (plataforma: ${platform})`);
    setProcessingIds(prev => [...prev, clientId]);
    
    try {
      let result;
      let lastError: any = null;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`🔄 Tentativa ${attempt + 1} de ${maxRetries + 1} para cliente ${clientId}`);
            await new Promise(r => setTimeout(r, 1500 * attempt));
          }
          
          if (platform === "meta") {
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
          
          // Se chegou aqui, deu certo
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
          const isTransient = err?.message?.includes('Failed to fetch') || 
                              err?.name === 'FunctionsFetchError' ||
                              err?.message?.includes('TypeError');
          
          if (!isTransient || attempt >= maxRetries) break;
          console.warn(`⚠️ Erro transitório na tentativa ${attempt + 1}:`, err.message);
        }
      }
      
      // Se ainda falhou, verificar no banco se a revisão foi criada mesmo assim
      if (lastError) {
        console.log(`🔍 Verificando no banco se revisão foi criada apesar do erro...`);
        const today = new Date().toISOString().split('T')[0];
        const { data: existingReview } = await supabase
          .from('budget_reviews')
          .select('id, updated_at')
          .eq('client_id', clientId)
          .eq('platform', platform)
          .eq('review_date', today)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (existingReview) {
          const updatedAt = new Date(existingReview.updated_at).getTime();
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          
          if (updatedAt > fiveMinutesAgo) {
            console.log(`✅ Revisão encontrada no banco (criada recentemente), tratando como sucesso`);
            lastError = null;
          }
        }
      }
      
      if (lastError) {
        const isTransient = lastError?.message?.includes('Failed to fetch') || 
                            lastError?.name === 'FunctionsFetchError';
        toast({
          title: isTransient ? "Instabilidade de conexão" : "Erro na revisão",
          description: isTransient 
            ? "A revisão pode ter sido processada no servidor. Atualize a página para verificar."
            : "Não foi possível revisar este cliente. Tente novamente.",
          variant: "destructive"
        });
        return { success: false, reason: isTransient ? "network_error" : "backend_error" };
      }
      
      console.log(`✅ Cliente ${clientId} analisado com sucesso:`, result);
      
      await invalidateAllQueries();
      
      if (onIndividualComplete) {
        console.log(`🔄 Executando callback de revisão individual para ${platform}`);
        onIndividualComplete();
      }
      
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Erro ao analisar cliente ${clientId}:`, error);
      toast({
        title: "Erro na revisão",
        description: "Não foi possível revisar este cliente. Tente novamente.",
        variant: "destructive"
      });
      return { success: false, reason: "unexpected_error" };
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
        
        const accountId = platform === "meta" 
          ? client.meta_account_id 
          : client.google_account_id;
        
        // Pular clientes sem conta cadastrada
        if (!accountId) {
          console.warn(`⚠️ Cliente ${client.company_name} não tem conta ${platform} cadastrada. Pulando...`);
          continue;
        }
        
        try {
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
