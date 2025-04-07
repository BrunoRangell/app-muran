
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useMetaReviewService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastConnectionStatus, setLastConnectionStatus] = useState<"success" | "error" | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const invokeMetaReview = async (payload: any) => {
    setIsLoading(true);
    let result = null;
    let error = null;

    try {
      console.log("Invocando função Edge de Revisão Meta:", {
        ...payload,
        // Ocultando informações sensíveis do log
        accessToken: payload.accessToken ? "***ACCESS_TOKEN***" : undefined,
      });

      // Adicionar timestamp para evitar cache
      const requestPayload = {
        ...payload,
        _timestamp: new Date().getTime()
      };

      // Definir timeout mais curto para detecção rápida de problemas
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao esperar resposta da função Edge (10s)")), 10000);
      });

      const responsePromise = supabase.functions.invoke("daily-meta-review", {
        body: requestPayload,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Corrida entre a resposta e o timeout
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;

      if (response.error) {
        console.error("Erro na função Edge de revisão Meta:", response.error);
        setLastConnectionStatus("error");
        setLastErrorMessage(response.error.message || "Erro desconhecido na função Edge");
        error = response.error;
        throw error;
      }

      console.log("Resposta da função Edge de revisão Meta:", response.data);
      result = response.data;
      setLastConnectionStatus("success");
      setLastErrorMessage(null);

      return { result, error: null };
    } catch (err) {
      console.error("Erro ao invocar função Edge de revisão Meta:", err);
      setLastConnectionStatus("error");
      setLastErrorMessage(err instanceof Error ? err.message : String(err));
      
      // Registro do erro no log do sistema
      try {
        await supabase
          .from("system_logs")
          .insert({
            event_type: "edge_function_error",
            message: "Erro ao invocar função Edge de revisão Meta",
            details: {
              error: err instanceof Error ? err.message : String(err),
              timestamp: new Date().toISOString(),
              payload: {
                ...payload,
                accessToken: payload.accessToken ? "***REDACTED***" : undefined
              }
            }
          });
      } catch (logError) {
        console.error("Erro ao registrar falha no log:", logError);
      }
      
      return {
        result: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    } finally {
      setIsLoading(false);
    }
  };

  const executeAutomaticReview = async () => {
    setIsLoading(true);
    
    try {
      console.log("Iniciando revisão automática Meta programada via interface");
      
      // Criar entrada de log primeiro
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "daily-meta-review-job",
          status: "started",
          details: {
            source: "ui_automatic",
            isAutomatic: true,
            executeReview: true,
            executionType: "real",
            test: false,
            forceExecution: true,
            timestamp: new Date().toISOString(),
          }
        })
        .select()
        .single();
        
      if (logError) {
        throw new Error(`Erro ao criar log de execução: ${logError.message}`);
      }
      
      // Chamar a função Edge com parâmetros completos
      const { result, error } = await invokeMetaReview({
        scheduled: true,
        executeReview: true,
        test: false,
        source: "ui_automatic",
        logId: logEntry.id,
        forceExecution: true,
        timestamp: new Date().toISOString(),
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Revisão automática Meta iniciada com sucesso:", result);
      toast({
        title: "Revisão automática iniciada",
        description: "O processo de revisão automática foi iniciado com sucesso.",
      });
      
      return { success: true, result };
    } catch (err) {
      console.error("Erro ao executar revisão automática Meta:", err);
      
      toast({
        title: "Erro na revisão automática",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      
      return { 
        success: false, 
        error: err instanceof Error ? err.message : String(err) 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const testMetaReviewFunction = async () => {
    setIsLoading(true);
    
    try {
      console.log("Testando conectividade com função de revisão Meta...");
      
      // Adicionar indicador de tempo para diagnóstico
      const startTime = performance.now();
      
      // Criar entrada de log primeiro
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "daily-meta-review-test-job",
          status: "started",
          details: {
            source: "ui_test",
            isAutomatic: false,
            executeReview: false,
            test: true,
            timestamp: new Date().toISOString(),
          }
        })
        .select()
        .single();
        
      if (logError) {
        throw new Error(`Erro ao criar log de teste: ${logError.message}`);
      }
      
      // Definir timeout mais curto para testes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao testar conexão (5s)")), 5000);
      });
      
      const requestPromise = invokeMetaReview({
        test: true,
        executeReview: false,
        source: "ui_test",
        logId: logEntry.id,
        timestamp: new Date().toISOString(),
        _nocache: Math.random() // Evitar cache
      });
      
      // Corrida entre a resposta e o timeout
      const { result, error } = await Promise.race([requestPromise, timeoutPromise]) as any;
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (error) {
        throw error;
      }
      
      // Registrar o sucesso no log do sistema
      await supabase
        .from("system_logs")
        .insert({
          event_type: "edge_function",
          message: "Teste de conectividade de revisão Meta realizado com sucesso",
          details: {
            timestamp: new Date().toISOString(),
            response: result,
            responseTime: `${responseTime}ms`,
            source: "ui_test"
          }
        });
      
      console.log(`Teste de revisão Meta bem-sucedido (${responseTime}ms):`, result);
      setLastConnectionStatus("success");
      setLastErrorMessage(null);
      
      toast({
        title: "Teste de conexão bem-sucedido",
        description: `Conectado à função Edge com sucesso (${responseTime}ms).`,
      });
      
      return { success: true, result, responseTime };
    } catch (err) {
      console.error("Erro ao testar função de revisão Meta:", err);
      setLastConnectionStatus("error");
      setLastErrorMessage(err instanceof Error ? err.message : String(err));
      
      // Registrar o erro no log do sistema
      await supabase
        .from("system_logs")
        .insert({
          event_type: "edge_function",
          message: "Erro no teste de conectividade de revisão Meta",
          details: {
            timestamp: new Date().toISOString(),
            error: err instanceof Error ? err.message : String(err),
            source: "ui_test"
          }
        });
      
      toast({
        title: "Erro no teste de conexão",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
      
      return { 
        success: false, 
        error: err instanceof Error ? err.message : String(err) 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetConnectionStatus = () => {
    setLastConnectionStatus(null);
    setLastErrorMessage(null);
  };

  return {
    invokeMetaReview,
    executeAutomaticReview,
    testMetaReviewFunction,
    isLoading,
    lastConnectionStatus,
    lastErrorMessage,
    resetConnectionStatus
  };
};
