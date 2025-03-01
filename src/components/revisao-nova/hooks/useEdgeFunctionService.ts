
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para testar e interagir com a Edge Function
 */
export const useEdgeFunctionService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Testa a conectividade com a Edge Function
   */
  const testEdgeFunction = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      // Verificar se a função Edge está disponível
      console.log("[testEdgeFunction] Tentando conectar à função Edge...");
      
      // Teste simples com payload mínimo
      const { data, error } = await supabase.functions.invoke(
        "daily-budget-reviews",
        { 
          body: { method: "ping" },
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      
      setDebugInfo({
        edgeFunctionTest: {
          success: !error,
          data,
          error,
          timestamp: new Date().toISOString()
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
        
        // Tentar classificar o tipo de erro
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
        }
        
        setDebugInfo(prev => ({
          ...prev,
          errorType,
          suggestion,
          possibleFixes: [
            "Verificar se a função 'daily-budget-reviews' está publicada no Supabase",
            "Verificar se há regras de CORS configuradas na função",
            "Tentar republicar a função Edge"
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

  /**
   * Invoca a Edge Function com payload personalizado
   */
  const invokeEdgeFunction = async (payload: any) => {
    try {
      console.log("[invokeEdgeFunction] Invocando função Edge com payload:", 
        { ...payload, accessToken: payload.accessToken ? "***TOKEN***" : undefined });
      
      // Adicionar timeout para evitar problemas de conexão pendente
      const functionPromise = supabase.functions.invoke(
        "daily-budget-reviews",
        { 
          body: payload,
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
      
      console.log("[invokeEdgeFunction] Resposta da função Edge:", result);
      
      if (functionError) {
        throw new Error(`Erro na função Edge: ${functionError.message || "Erro desconhecido"}`);
      }
      
      return { result, error: null };
    } catch (err) {
      console.error("[invokeEdgeFunction] Erro:", err);
      return { 
        result: null, 
        error: err instanceof Error ? err : new Error(String(err)) 
      };
    }
  };

  return {
    testEdgeFunction,
    invokeEdgeFunction,
    isLoading,
    debugInfo
  };
};
