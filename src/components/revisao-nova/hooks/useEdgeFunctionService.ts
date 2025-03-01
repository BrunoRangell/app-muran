
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
   * Chama a função Edge com timeout
   */
  const invokeEdgeFunction = async (payload: any) => {
    try {
      console.log("[useEdgeFunctionService] Tentando invocar função Edge...");
      
      // Validar payload
      if (!payload || typeof payload !== 'object') {
        throw new Error("Payload inválido para a requisição da função Edge");
      }
      
      // Preparar cópia para log (sem dados sensíveis)
      const payloadForLog = { ...payload };
      if (payloadForLog.accessToken) {
        payloadForLog.accessToken = "***TOKEN OCULTADO***";
      }
      
      console.log("[useEdgeFunctionService] Enviando payload para Edge Function:", JSON.stringify(payloadForLog));
      
      // Converter para string com tratamento de erros
      let payloadString;
      try {
        payloadString = JSON.stringify(payload);
        
        if (!payloadString || payloadString === '{}' || payloadString === 'null') {
          throw new Error("Serialização do payload resultou em dados vazios");
        }
        
        console.log("[useEdgeFunctionService] Tamanho do payload serializado:", payloadString.length, "bytes");
      } catch (serializationError) {
        console.error("[useEdgeFunctionService] Erro ao serializar payload:", serializationError);
        throw new Error(`Erro ao preparar dados para envio: ${serializationError instanceof Error ? serializationError.message : String(serializationError)}`);
      }
      
      // Adicionar timeout para evitar problemas de conexão pendente
      const functionPromise = supabase.functions.invoke(
        "daily-budget-reviews", 
        { 
          body: payloadString,
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
      const testPayload = { method: "ping" };
      
      // Serializar o payload para JSON
      const testPayloadString = JSON.stringify(testPayload);
      
      // Verificar se o payload foi corretamente serializado
      if (!testPayloadString || testPayloadString === '{}' || testPayloadString === 'null') {
        throw new Error("Erro ao serializar payload de teste");
      }
      
      console.log("[testEdgeFunction] Enviando payload de teste:", testPayloadString);
      
      const { data, error } = await supabase.functions.invoke(
        "daily-budget-reviews",
        { 
          body: testPayloadString,
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
          payloadSent: testPayload,
          payloadSize: testPayloadString.length
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
          possibleFixes: [
            "Verificar se a função 'daily-budget-reviews' está publicada no Supabase",
            "Verificar se há regras de CORS configuradas na função",
            "Tentar republicar a função Edge",
            "Verificar se o payload está sendo serializado corretamente"
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
