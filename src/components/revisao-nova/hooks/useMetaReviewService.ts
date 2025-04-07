
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useMetaReviewService = () => {
  const [isLoading, setIsLoading] = useState(false);

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

      const response = await supabase.functions.invoke("daily-meta-review", {
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.error) {
        console.error("Erro na função Edge de revisão Meta:", response.error);
        error = response.error;
        throw error;
      }

      console.log("Resposta da função Edge de revisão Meta:", response.data);
      result = response.data;

      return { result, error: null };
    } catch (err) {
      console.error("Erro ao invocar função Edge de revisão Meta:", err);
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
      return { success: true, result };
    } catch (err) {
      console.error("Erro ao executar revisão automática Meta:", err);
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
      
      // Fazer uma requisição de teste
      const { result, error } = await invokeMetaReview({
        test: true,
        executeReview: false,
        source: "ui_test",
        logId: logEntry.id,
        timestamp: new Date().toISOString(),
      });
      
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
            source: "ui_test"
          }
        });
      
      console.log("Teste de revisão Meta bem-sucedido:", result);
      return { success: true, result };
    } catch (err) {
      console.error("Erro ao testar função de revisão Meta:", err);
      
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
      
      return { 
        success: false, 
        error: err instanceof Error ? err.message : String(err) 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    invokeMetaReview,
    executeAutomaticReview,
    testMetaReviewFunction,
    isLoading,
  };
};
