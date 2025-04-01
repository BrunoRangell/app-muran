
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { preparePayload, preparePayloadForLog } from "./edge-function/payloadUtils";
import { invokeEdgeFunction, testEdgeConnectivity } from "./edge-function/edgeFunctionService";
import { analyzeEdgeError, inspectPayload } from "./edge-function/diagnosticService";

/**
 * Hook para gerenciar comunicação com funções Edge
 */
export const useEdgeFunctionService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Chama a função Edge com preparação de payload
   */
  const callEdgeFunction = async (payload: any) => {
    try {
      // Preparar o payload para garantir que está limpo
      const safePayload = preparePayload(payload);
      
      // Log com dados sensíveis ocultados
      console.log("[useEdgeFunctionService] Enviando payload:", 
                JSON.stringify(preparePayloadForLog(safePayload)));
      
      // Chamar a função Edge
      return await invokeEdgeFunction(safePayload);
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
        timestamp: new Date().toISOString(),
        test: true
      };
      
      console.log("[testEdgeFunction] Enviando payload de teste:", JSON.stringify(testPayload));
      
      // Usar abordagem com fetch direto para testar
      const testResult = await testEdgeConnectivity(testPayload);
      
      console.log("[testEdgeFunction] Resposta do teste (fetch direto):", testResult);
      
      // Preparar informações de debug
      setDebugInfo({
        edgeFunctionTest: {
          success: testResult.success,
          data: testResult.data,
          error: testResult.error,
          timestamp: new Date().toISOString(),
          payloadSent: testPayload,
          payloadSize: JSON.stringify(testPayload).length,
          responseStatus: testResult.statusCode,
          approach: "fetch direct"
        }
      });
      
      // Verificar resultado
      if (!testResult.success) {
        const errorMsg = testResult.error?.message || "Erro ao conectar à função Edge";
        console.error("[testEdgeFunction] Falha no teste:", errorMsg);
        
        toast({
          title: "Erro na função Edge",
          description: `Não foi possível conectar à função Edge: ${errorMsg}`,
          variant: "destructive",
        });
        
        // Analisar erro e gerar diagnóstico
        const diagnostics = analyzeEdgeError(testResult.error);
        
        setDebugInfo(prev => ({
          ...prev,
          ...diagnostics,
          payloadInspection: inspectPayload(testPayload)
        }));
        
        return false;
      }
      
      console.log("[testEdgeFunction] Teste bem-sucedido:", testResult.data);
      
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
      setLoading(false);
    }
  };

  return {
    invokeEdgeFunction: callEdgeFunction,
    testEdgeFunction,
    isLoading,
    error,
    debugInfo
  };
};
