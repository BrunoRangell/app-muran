
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useMetaReviewService = () => {
  const [isLoading, setIsLoading] = useState(false);
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

      const response = await supabase.functions.invoke("daily-meta-review", {
        body: requestPayload,
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

  return {
    invokeMetaReview,
    isLoading
  };
};
