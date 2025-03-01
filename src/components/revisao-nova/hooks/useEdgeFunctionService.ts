
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

    // Problema: vários níveis de transformação podem estar causando perda do payload
    // Vamos simplificar e criar um objeto novo diretamente
    const cleanPayload = {};
    
    // Copiar manualmente as propriedades para garantir um objeto limpo
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        // Se for um objeto aninhado, clonar também
        if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
          cleanPayload[key] = { ...payload[key] };
        } else if (Array.isArray(payload[key])) {
          cleanPayload[key] = [...payload[key]];
        } else {
          cleanPayload[key] = payload[key];
        }
      }
    }
    
    // Verificar se payload está vazio após processamento
    if (Object.keys(cleanPayload).length === 0) {
      console.warn("[useEdgeFunctionService] AVISO: Payload está vazio após processamento!");
    }
    
    // Verificação adicional para debug
    console.log("[useEdgeFunctionService] Payload processado:", cleanPayload);
    console.log("[useEdgeFunctionService] Tipo do payload:", typeof cleanPayload);
    
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
   * Chama a função Edge sem transformação adicional
   */
  const invokeEdgeFunction = async (payload: any) => {
    try {
      console.log("[useEdgeFunctionService] Tentando invocar função Edge...");
      
      // Simplificar: não usar transformações complicadas
      // Apenas verificar se o payload é válido e copiar direto
      if (!payload || typeof payload !== 'object') {
        throw new Error("Payload inválido para função Edge");
      }
      
      // Copiar payload diretamente sem processamento adicional
      const safePayload = { ...payload };
      
      // Log simplificado
      console.log("[useEdgeFunctionService] Enviando payload:", 
                  JSON.stringify(preparePayloadForLog(safePayload)));
      
      console.log("[useEdgeFunctionService] Tamanho do payload:", 
                  JSON.stringify(safePayload).length, "bytes");
      
      // Adicionar timeout para evitar problemas de conexão pendente
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao esperar resposta da função Edge (15s)")), 15000);
      });
      
      // IMPORTANTE: Não realizar nenhuma transformação adicional no payload
      // Deixar o Supabase lidar com a serialização
      const functionPromise = supabase.functions.invoke(
        "daily-budget-reviews", 
        { 
          body: safePayload
        }
      );
      
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
      
      // Usar abordagem simplificada para o teste
      const rawResponse = await fetch(`${supabase.functions.url}/daily-budget-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token)}`
        },
        body: JSON.stringify(testPayload)
      });
      
      const data = await rawResponse.json();
      const error = !rawResponse.ok ? { message: `HTTP error ${rawResponse.status}` } : null;
      
      console.log("[testEdgeFunction] Resposta do teste (fetch direto):", data, error);
      
      setDebugInfo({
        edgeFunctionTest: {
          success: !error,
          data,
          error,
          timestamp: new Date().toISOString(),
          payloadSent: testPayload,
          payloadSize: JSON.stringify(testPayload).length,
          responseStatus: rawResponse.status,
          responseStatusText: rawResponse.statusText,
          approach: "fetch direct"
        }
      });
      
      if (error || !data || data.error) {
        const errorMsg = error?.message || data?.error?.message || "Erro ao conectar à função Edge";
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
            payloadType: typeof testPayload,
            isNull: testPayload === null,
            isUndefined: testPayload === undefined,
            isEmpty: Object.keys(testPayload || {}).length === 0,
            stringifiedLength: JSON.stringify(testPayload || {}).length,
            rawPayload: testPayload
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
          timestamp: new Date().toISOString(),
          approach: "fetch direct"
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
