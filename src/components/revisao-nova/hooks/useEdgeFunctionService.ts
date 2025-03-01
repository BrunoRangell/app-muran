
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para gerenciar comunicação com funções Edge
 */
export const useEdgeFunctionService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Serializa o payload de forma segura para envio
   */
  const preparePayload = (payload: any) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error("Payload inválido para a requisição da função Edge");
    }

    // Criar uma cópia limpa do objeto (deep copy mais seguro)
    const cleanPayload = JSON.parse(JSON.stringify(payload));
    
    // Verificar se payload está vazio após processamento
    if (Object.keys(cleanPayload).length === 0) {
      console.warn("[useEdgeFunctionService] AVISO: Payload está vazio após processamento!");
    }
    
    return cleanPayload;
  };

  /**
   * Prepara um objeto para logging (removendo dados sensíveis)
   */
  const preparePayloadForLog = (payload: any) => {
    const payloadForLog = { ...payload };
    
    // Ocultar dados sensíveis
    if (payloadForLog.accessToken) {
      payloadForLog.accessToken = "***TOKEN OCULTADO***";
    }
    
    return payloadForLog;
  };

  /**
   * Chama a função Edge com timeout
   */
  const invokeEdgeFunction = async (payload: any) => {
    try {
      console.log("[useEdgeFunctionService] Tentando invocar função Edge...");
      
      // Preparar payload de forma segura
      const safePayload = preparePayload(payload);
      
      // Preparar cópia para log (sem dados sensíveis)
      const payloadForLog = preparePayloadForLog(payload);
      console.log("[useEdgeFunctionService] Enviando payload para Edge Function:", 
                  JSON.stringify(payloadForLog, null, 2));
      
      console.log("[useEdgeFunctionService] Tamanho do payload:", 
                  JSON.stringify(safePayload).length, "bytes");
      
      // Adicionar timeout para evitar problemas de conexão pendente
      const functionPromise = supabase.functions.invoke(
        "daily-budget-reviews", 
        { 
          body: safePayload,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      
      // Timeout de 15 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao esperar resposta da função Edge (15s)")), 15000);
      });
      
      // Corrida entre a função e o timeout
      const { data: result, error: functionError } = await Promise.race([
        functionPromise,
        timeoutPromise
      ]) as any;
      
      console.log("[useEdgeFunctionService] Resposta da função Edge:", result);
      
      if (functionError) {
        console.error("[useEdgeFunctionService] Erro na função Edge:", functionError);
        throw new Error(`Erro na função Edge: ${functionError.message || "Erro desconhecido"}`);
      }
      
      if (!result) {
        console.error("[useEdgeFunctionService] Resultado vazio da função Edge");
        throw new Error("A função retornou dados vazios ou inválidos");
      }
      
      return { result };
    } catch (err) {
      console.error("[useEdgeFunctionService] Erro ao chamar função Edge:", err);
      return { error: err };
    }
  };

  /**
   * Testa a disponibilidade da função Edge
   */
  const testEdgeFunction = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      console.log("[testEdgeFunction] Tentando conectar à função Edge...");
      
      // Teste simples com payload mínimo
      const testPayload = { 
        method: "ping",
        timestamp: new Date().toISOString() 
      };
      
      console.log("[testEdgeFunction] Enviando payload de teste:", JSON.stringify(testPayload));
      
      // Usar o método seguro de preparação de payload
      const safePayload = preparePayload(testPayload);
      
      const { data, error } = await supabase.functions.invoke(
        "daily-budget-reviews",
        { 
          body: safePayload,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      
      console.log("[testEdgeFunction] Resposta do teste:", data, error);
      
      setDebugInfo({
        edgeFunctionTest: {
          success: !error,
          data,
          error,
          timestamp: new Date().toISOString(),
          payloadSent: safePayload,
          payloadSize: JSON.stringify(safePayload).length
        }
      });
      
      if (error) {
        const errorMsg = error.message || "Erro ao conectar à função Edge";
        console.error("[testEdgeFunction] Falha no teste:", errorMsg);
        
        toast({
          title: "Erro na função Edge",
          description: `Não foi possível conectar à função Edge: ${errorMsg}`,
          variant: "destructive",
        });
        
        // Classificar tipo de erro
        let errorType = "UNKNOWN";
        let suggestion = "";
        
        if (errorMsg.includes("Failed to send") || errorMsg.includes("fetch")) {
          errorType = "NETWORK_ERROR";
          suggestion = "Verifique se a função Edge está publicada e se o Supabase está online.";
        } else if (errorMsg.includes("timeout") || errorMsg.includes("Timeout")) {
          errorType = "TIMEOUT_ERROR";
          suggestion = "A função Edge demorou muito para responder. Pode ser um problema de conexão ou sobrecarga.";
        } else if (errorMsg.includes("CORS") || errorMsg.includes("cross-origin")) {
          errorType = "CORS_ERROR";
          suggestion = "Problema de CORS. Verifique se a função Edge tem as configurações corretas de CORS.";
        } else if (errorMsg.includes("Corpo da requisição vazio")) {
          errorType = "EMPTY_BODY_ERROR";
          suggestion = "O corpo da requisição está vazio. Verifique a serialização do payload e o content-type.";
        }
        
        setDebugInfo(prev => ({
          ...prev,
          errorType,
          suggestion,
          payloadInspection: {
            payloadType: typeof safePayload,
            isNull: safePayload === null,
            isUndefined: safePayload === undefined,
            isEmpty: Object.keys(safePayload || {}).length === 0,
            stringifiedLength: JSON.stringify(safePayload || {}).length
          },
          possibleFixes: [
            "Verificar se a função 'daily-budget-reviews' está publicada no Supabase",
            "Verificar se há regras de CORS configuradas na função",
            "Tentar republicar a função Edge",
            "Verificar as configurações de permissão da função no Supabase"
          ]
        }));
        
        return false;
      }
      
      console.log("[testEdgeFunction] Teste bem-sucedido:", data);
      
      toast({
        title: "Função Edge disponível",
        description: "Conexão com a função Edge estabelecida com sucesso.",
      });
      
      return true;
    } catch (err) {
      console.error("[testEdgeFunction] Erro:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      setDebugInfo({
        edgeFunctionTest: {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Erro na função Edge",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    invokeEdgeFunction,
    testEdgeFunction,
    isLoading,
    error,
    debugInfo
  };
};
