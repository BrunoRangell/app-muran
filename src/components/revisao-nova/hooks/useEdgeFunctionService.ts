
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useEdgeFunctionService = () => {
  const [isLoading, setIsLoading] = useState(false);

  const invokeEdgeFunction = async (payload: any) => {
    setIsLoading(true);
    let result = null;
    let error = null;

    try {
      console.log("Invocando função Edge:", {
        ...payload,
        // Ocultando informações sensíveis do log
        accessToken: payload.accessToken ? "***ACCESS_TOKEN***" : undefined,
      });

      const response = await supabase.functions.invoke("daily-budget-reviews", {
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.error) {
        console.error("Erro na função Edge:", response.error);
        error = response.error;
        throw error;
      }

      console.log("Resposta da função Edge:", response.data);
      result = response.data;

      return { result, error: null };
    } catch (err) {
      console.error("Erro ao invocar função Edge:", err);
      return {
        result: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    } finally {
      setIsLoading(false);
    }
  };

  const testEdgeFunction = async () => {
    setIsLoading(true);
    let success = false;

    try {
      console.log("Testando conectividade com função Edge...");

      // Primeiro, tentamos uma requisição de teste para verificar se a função está acessível
      const { result, error } = await invokeEdgeFunction({
        test: true,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error("Erro no teste da função Edge:", error);
        throw error;
      }

      if (!result) {
        throw new Error("A função retornou um resultado vazio");
      }

      console.log("Teste da função Edge bem-sucedido:", result);

      // Também testamos uma requisição de status do cron
      const cronTestResponse = await invokeEdgeFunction({
        testType: "cron_status_check",
        timestamp: new Date().toISOString(),
      });

      if (cronTestResponse.error) {
        console.warn(
          "Aviso: O teste de status do cron falhou, mas a função principal está funcionando:",
          cronTestResponse.error
        );
      } else {
        console.log("Teste de status do cron bem-sucedido:", cronTestResponse.result);
      }

      success = true;
      return true;
    } catch (err) {
      console.error("Erro ao testar função Edge:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    invokeEdgeFunction,
    isLoading,
    testEdgeFunction,
  };
};
