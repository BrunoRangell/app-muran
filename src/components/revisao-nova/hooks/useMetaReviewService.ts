
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useMetaReviewService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastConnectionStatus, setLastConnectionStatus] = useState<"success" | "error" | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const [lastErrorDetails, setLastErrorDetails] = useState<any>(null);
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

      // Verificar se o payload é válido antes de enviar
      if (!requestPayload || typeof requestPayload !== 'object') {
        throw new Error("Payload inválido para função Edge");
      }

      // Serializar e validar o payload
      let serializedPayload;
      try {
        serializedPayload = JSON.stringify(requestPayload);
        // Verificar se o JSON é válido tentando parsear de volta
        JSON.parse(serializedPayload);
      } catch (serializeError) {
        console.error("Erro ao serializar payload:", serializeError);
        throw new Error(`Erro na preparação da requisição: ${serializeError.message}`);
      }

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
        
        // Tratamento especial para erro de parsing JSON
        if (response.error.message && response.error.message.includes("JSON")) {
          setLastErrorMessage("Erro no processamento da resposta JSON");
          setLastErrorDetails({
            originalError: response.error.message,
            possibleCause: "Função Edge retornou resposta inválida ou vazia",
            suggestion: "Verifique se a função Edge está publicada corretamente e se está respondendo com JSON válido"
          });
        } else {
          setLastErrorMessage(response.error.message || "Erro desconhecido na função Edge");
          setLastErrorDetails({
            originalError: response.error,
            statusCode: response.status || "Desconhecido"
          });
        }
        
        error = response.error;
        throw error;
      }

      console.log("Resposta da função Edge de revisão Meta:", response.data);
      result = response.data;
      setLastConnectionStatus("success");
      setLastErrorMessage(null);
      setLastErrorDetails(null);

      return { result, error: null };
    } catch (err) {
      console.error("Erro ao invocar função Edge de revisão Meta:", err);
      setLastConnectionStatus("error");
      
      // Extrair detalhes específicos do erro para diagnóstico
      let errorMessage = err instanceof Error ? err.message : String(err);
      let errorDetails = null;
      
      // Detectar erros específicos para melhor diagnóstico
      if (errorMessage.includes("Unexpected end of JSON input") || 
          errorMessage.includes("JSON")) {
        errorMessage = "Erro de formato na resposta JSON (Unexpected end of JSON input)";
        errorDetails = {
          type: "JSON_PARSE_ERROR",
          message: "A função Edge retornou um JSON inválido ou incompleto",
          suggestions: [
            "Verifique se a função Edge retorna uma resposta JSON bem-formada",
            "Verifique os logs da função Edge para erros no processamento",
            "Tente republicar a função Edge no console do Supabase"
          ]
        };
      } else if (errorMessage.includes("non-2xx status code")) {
        errorMessage = "Erro de comunicação: Função Edge retornou código de status não-2xx";
        errorDetails = {
          type: "HTTP_STATUS_ERROR",
          suggestions: [
            "Verifique os logs da função Edge para identificar o erro",
            "Confirme se a função está publicada e respondendo corretamente",
            "Verifique se você tem as permissões corretas para acessar a função"
          ]
        };
      } else if (errorMessage.includes("Timeout")) {
        errorMessage = "Timeout ao conectar à função Edge";
        errorDetails = {
          type: "TIMEOUT_ERROR",
          suggestions: [
            "Verifique se a função Edge está online e respondendo",
            "Verifique se há problemas de rede ou firewall bloqueando a conexão",
            "Tente aumentar o timeout da requisição se o processamento for lento"
          ]
        };
      }
      
      setLastErrorMessage(errorMessage);
      setLastErrorDetails(errorDetails);
      
      // Registro do erro no log do sistema
      try {
        await supabase
          .from("system_logs")
          .insert({
            event_type: "edge_function_error",
            message: "Erro ao invocar função Edge de revisão Meta",
            details: {
              error: errorMessage,
              errorDetails,
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
      
      // Validar payload antes de enviar
      const payload = {
        scheduled: true,
        executeReview: true,
        test: false,
        source: "ui_automatic",
        logId: logEntry.id,
        forceExecution: true,
        timestamp: new Date().toISOString(),
      };
      
      // Chamar a função Edge com parâmetros completos
      const { result, error } = await invokeMetaReview(payload);
      
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
      
      // Preparar payload simplificado para teste
      const testPayload = {
        test: true,
        executeReview: false,
        source: "ui_test",
        logId: logEntry.id,
        timestamp: new Date().toISOString(),
        _nocache: Math.random() // Evitar cache
      };
      
      // Definir timeout mais curto para testes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao testar conexão (5s)")), 5000);
      });
      
      const requestPromise = invokeMetaReview(testPayload);
      
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
      setLastErrorDetails(null);
      
      toast({
        title: "Teste de conexão bem-sucedido",
        description: `Conectado à função Edge com sucesso (${responseTime}ms).`,
      });
      
      return { success: true, result, responseTime };
    } catch (err) {
      console.error("Erro ao testar função de revisão Meta:", err);
      setLastConnectionStatus("error");
      
      // Extrair mensagem e detalhes do erro para diagnóstico
      let errorMessage = err instanceof Error ? err.message : String(err);
      let errorDetails = null;
      
      if (errorMessage.includes("Unexpected end of JSON input") || 
          errorMessage.includes("JSON")) {
        errorMessage = "Erro de formato na resposta JSON";
        errorDetails = {
          type: "JSON_PARSE_ERROR",
          message: "A função Edge retornou um JSON inválido ou incompleto"
        };
      }
      
      setLastErrorMessage(errorMessage);
      setLastErrorDetails(errorDetails);
      
      // Registrar o erro no log do sistema
      await supabase
        .from("system_logs")
        .insert({
          event_type: "edge_function",
          message: "Erro no teste de conectividade de revisão Meta",
          details: {
            timestamp: new Date().toISOString(),
            error: errorMessage,
            errorDetails,
            source: "ui_test"
          }
        });
      
      toast({
        title: "Erro no teste de conexão",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { 
        success: false, 
        error: errorMessage,
        errorDetails
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetConnectionStatus = () => {
    setLastConnectionStatus(null);
    setLastErrorMessage(null);
    setLastErrorDetails(null);
  };

  return {
    invokeMetaReview,
    executeAutomaticReview,
    testMetaReviewFunction,
    isLoading,
    lastConnectionStatus,
    lastErrorMessage,
    lastErrorDetails,
    resetConnectionStatus
  };
};
