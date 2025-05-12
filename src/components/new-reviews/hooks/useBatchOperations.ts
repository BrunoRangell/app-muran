
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "@/lib/metaAuth";
import { useToast } from "@/hooks/use-toast";

export function useBatchOperations(
  platform: 'meta' | 'google' = 'meta',
  onSuccess?: () => void
) {
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Função para analisar um cliente
  const analyzeClient = async (clientId: string) => {
    if (processingIds.includes(clientId)) {
      return;
    }
    
    setProcessingIds(prev => [...prev, clientId]);
    
    try {
      let success = false;
      
      if (platform === 'meta') {
        success = await analyzeMetaClient(clientId);
      } else {
        success = await analyzeGoogleClient(clientId);
      }
      
      if (success) {
        toast({
          title: `Cliente analisado`,
          description: "A análise foi concluída com sucesso.",
        });
      }
      
    } catch (error) {
      console.error(`Erro ao analisar cliente ${clientId}:`, error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== clientId));
      if (onSuccess) onSuccess();
    }
  };
  
  // Função para análise em lote
  const batchAnalyze = async (clientIds: string[]) => {
    if (clientIds.length === 0 || isProcessingBatch) {
      return;
    }
    
    setIsProcessingBatch(true);
    setProcessingIds(clientIds);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      if (platform === 'meta') {
        // Analisar clientes Meta
        const { data, error } = await supabase.functions.invoke("review-meta-clients-batch", {
          body: { clientIds }
        });
        
        if (error) {
          throw new Error(`Erro na análise em lote: ${error.message}`);
        }
        
        if (data?.results) {
          successCount = data.results.filter((r: any) => r.success).length;
          failCount = data.results.filter((r: any) => !r.success).length;
        }
      } else {
        // Analisar clientes Google
        const { data, error } = await supabase.functions.invoke("review-google-ads-batch", {
          body: { clientIds }
        });
        
        if (error) {
          throw new Error(`Erro na análise em lote: ${error.message}`);
        }
        
        if (data?.results) {
          successCount = data.results.filter((r: any) => r.success).length;
          failCount = data.results.filter((r: any) => !r.success).length;
        }
      }
      
      // Exibir resultado da operação em lote
      toast({
        title: "Análise em lote concluída",
        description: `${successCount} cliente(s) analisado(s) com sucesso. ${failCount > 0 ? `${failCount} falha(s).` : ''}`,
        variant: failCount > 0 ? "default" : "default",
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro na análise em lote:", error);
      toast({
        title: "Erro na análise em lote",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
      setProcessingIds([]);
    }
  };
  
  // Analisar cliente Meta
  const analyzeMetaClient = async (clientId: string): Promise<boolean> => {
    const accessToken = await getMetaAccessToken();
    
    if (!accessToken) {
      throw new Error("Token de acesso Meta não disponível");
    }
    
    // Obter cliente
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("meta_account_id")
      .eq("id", clientId)
      .single();
      
    if (clientError || !client.meta_account_id) {
      throw new Error("Cliente não possui ID de conta Meta configurado");
    }
    
    // Chamar função edge para fazer a análise
    const { data, error } = await supabase.functions.invoke("daily-meta-review", {
      body: {
        clientId: clientId,
        accessToken: accessToken,
        accountId: client.meta_account_id
      }
    });
    
    if (error) {
      throw new Error(`Erro ao analisar cliente: ${error.message}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || "Erro desconhecido na análise");
    }
    
    return true;
  };
  
  // Analisar cliente Google
  const analyzeGoogleClient = async (clientId: string): Promise<boolean> => {
    // Chamar função edge para fazer a análise
    const { data, error } = await supabase.functions.invoke("review-google-ads-client", {
      body: {
        clientId: clientId
      }
    });
    
    if (error) {
      throw new Error(`Erro ao analisar cliente Google Ads: ${error.message}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || "Erro desconhecido na análise");
    }
    
    return true;
  };
  
  return {
    analyzeClient,
    batchAnalyze,
    isProcessingBatch,
    processingIds
  };
}
