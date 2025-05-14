
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { useToast } from "@/hooks/use-toast";

interface BatchOperationsProps {
  platform: "meta" | "google";
  onComplete?: () => void;
}

export function useBatchOperationsV2({ platform, onComplete }: BatchOperationsProps) {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Função para revisar um único cliente
  const reviewClient = async (clientId: string, accountId?: string) => {
    try {
      setProcessingIds((prev) => [...prev, clientId]);

      // Chamada para a Edge Function apropriada com base na plataforma
      const fn = platform === "meta" 
        ? "review_meta_ads_client" 
        : "review_google_ads_client";

      // Chamar edge function para revisar o cliente
      const { data, error } = await supabase.functions.invoke(fn, {
        body: {
          clientId,
          accountId
        },
      });

      if (error) {
        console.error(`Erro ao revisar cliente ${clientId}:`, error);
        toast({
          title: "Erro ao revisar cliente",
          description: "Ocorreu um erro ao processar a revisão.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Revisão concluída",
          description: "Cliente revisado com sucesso.",
        });
      }

      return data;
    } catch (error) {
      console.error("Erro durante revisão:", error);
      toast({
        title: "Erro na revisão",
        description: "Ocorreu um erro inesperado durante o processo.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== clientId));
    }
  };

  // Função para revisar múltiplos clientes em lote
  const reviewAllClients = async (clients: ClientWithReview[]) => {
    setIsProcessing(true);
    setProgress(0);
    setTotal(clients.length);

    try {
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        await reviewClient(client.id, client[`${platform}_account_id`]);
        setProgress(i + 1);
      }

      toast({
        title: "Processamento em lote concluído",
        description: `${clients.length} clientes foram revisados com sucesso.`,
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Erro no processamento em lote:", error);
      toast({
        title: "Erro no processamento em lote",
        description: "Alguns clientes não puderam ser revisados.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    reviewClient,
    reviewAllClients,
    isProcessing,
    processingIds,
    progress,
    total,
  };
}
