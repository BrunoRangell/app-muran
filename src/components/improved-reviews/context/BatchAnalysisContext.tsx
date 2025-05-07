
import React, { createContext, useState, useContext, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface BatchAnalysisContextType {
  isBatchAnalyzing: boolean;
  batchProgress: number;
  totalClientsToAnalyze: number;
  processingClients: string[];
  startBatchAnalysis: (platform: "meta" | "google" | "all") => Promise<void>;
  reviewSingleClient: (clientId: string, platform?: "meta" | "google") => Promise<void>;
  resetAnalysisState: () => void;
  isProcessingClient: (clientId: string) => boolean;
}

const BatchAnalysisContext = createContext<BatchAnalysisContextType>({} as BatchAnalysisContextType);

export const BatchAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetAnalysisState = useCallback(() => {
    setIsBatchAnalyzing(false);
    setBatchProgress(0);
    setTotalClientsToAnalyze(0);
    setProcessingClients([]);
  }, []);

  const isProcessingClient = useCallback((clientId: string) => {
    return processingClients.includes(clientId);
  }, [processingClients]);

  const reviewSingleClient = useCallback(async (clientId: string, platform: "meta" | "google" = "meta") => {
    try {
      if (isProcessingClient(clientId)) {
        toast({
          title: "Análise em andamento",
          description: "Este cliente já está sendo analisado.",
        });
        return;
      }

      setProcessingClients(prev => [...prev, clientId]);

      // Aqui faríamos a chamada para a função Edge de revisão
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: {
          clientId,
          reviewDate: new Date().toISOString().split("T")[0]
        }
      });

      if (error) {
        throw new Error(`Erro ao analisar cliente: ${error.message}`);
      }

      // Atualizar cache do React Query
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      
      toast({
        title: "Análise concluída",
        description: "A revisão do cliente foi concluída com sucesso."
      });
    } catch (err) {
      console.error("Erro ao analisar cliente:", err);
      toast({
        title: "Erro na análise",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [isProcessingClient, toast, queryClient]);

  const startBatchAnalysis = useCallback(async (platform: "meta" | "google" | "all" = "meta") => {
    try {
      if (isBatchAnalyzing) {
        toast({
          title: "Análise em lote em andamento",
          description: "Aguarde a conclusão da análise em lote atual.",
        });
        return;
      }

      // Buscar clientes ativos com meta_account_id configurado
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id, google_account_id")
        .eq("status", "active")
        .order("company_name");

      if (clientsError) {
        throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
      }

      const clientsToAnalyze = clients.filter(client => {
        if (platform === "meta") return client.meta_account_id;
        if (platform === "google") return client.google_account_id;
        return client.meta_account_id || client.google_account_id;
      });

      if (clientsToAnalyze.length === 0) {
        toast({
          title: "Nenhum cliente para analisar",
          description: "Não existem clientes com contas configuradas.",
        });
        return;
      }

      setIsBatchAnalyzing(true);
      setTotalClientsToAnalyze(clientsToAnalyze.length);
      setBatchProgress(0);
      
      toast({
        title: "Análise em lote iniciada",
        description: `Analisando ${clientsToAnalyze.length} clientes...`,
      });

      // Executar a análise para cada cliente sequencialmente
      for (let i = 0; i < clientsToAnalyze.length; i++) {
        const client = clientsToAnalyze[i];
        
        try {
          await reviewSingleClient(client.id, platform === "all" ? (client.meta_account_id ? "meta" : "google") : platform);
        } catch (err) {
          console.error(`Erro ao analisar cliente ${client.company_name}:`, err);
          // Continuar com os próximos clientes mesmo se houver erro
        }
        
        setBatchProgress(i + 1);
      }

      toast({
        title: "Análise em lote concluída",
        description: `${clientsToAnalyze.length} clientes analisados com sucesso.`,
      });
    } catch (err) {
      console.error("Erro na análise em lote:", err);
      toast({
        title: "Erro na análise em lote",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsBatchAnalyzing(false);
    }
  }, [isBatchAnalyzing, toast, reviewSingleClient]);

  const value = {
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    processingClients,
    startBatchAnalysis,
    reviewSingleClient,
    resetAnalysisState,
    isProcessingClient,
  };

  return (
    <BatchAnalysisContext.Provider value={value}>
      {children}
    </BatchAnalysisContext.Provider>
  );
};

export const useBatchAnalysis = () => useContext(BatchAnalysisContext);
