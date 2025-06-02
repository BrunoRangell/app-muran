import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AnalysisResult } from "./types";
import { AppError } from "@/lib/errors";

/**
 * Hook para fornecer funcionalidade de chamada à Edge Function
 */
export const useEdgeFunction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  const callFunction = async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await callEdgeFunction(clientId);
      
      // Invalidar queries após sucesso para forçar atualização da interface
      queryClient.invalidateQueries({ queryKey: ["improved-meta-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["unified-reviews-data"] });
      queryClient.invalidateQueries({ queryKey: ["client-current-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["daily-budget-reviews"] });
      
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    callFunction,
    isLoading,
    error
  };
};

/**
 * Obtém o token de acesso da Meta ads a partir do banco de dados
 */
export const getMetaAccessToken = async (): Promise<string | null> => {
  try {
    const { data: tokens, error: tokensError } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_access_token")
      .maybeSingle();
    
    if (tokensError) {
      console.error("Erro ao buscar token Meta Ads:", tokensError);
      throw new Error("Erro ao buscar token Meta Ads: " + tokensError.message);
    }
    
    if (!tokens?.value) {
      console.error("Token Meta Ads não encontrado ou está vazio");
      throw new Error("Token Meta Ads não configurado. Configure o token na página de configurações.");
    }
    
    return tokens.value;
  } catch (error) {
    console.error("Erro ao obter token de acesso Meta:", error);
    return null;
  }
};

/**
 * Invoca a função Edge para análise de orçamento conectando-se à API da Meta Ads
 */
export const invokeEdgeFunction = async (
  clientId: string,
  formattedDate: string
): Promise<AnalysisResult> => {
  console.log(`Invocando função Edge para análise real da Meta Ads - cliente ID: ${clientId}, data: ${formattedDate}`);
  
  try {
    // Verificar se há token configurado
    const accessToken = await getMetaAccessToken();
    
    if (!accessToken) {
      throw new Error("Token Meta Ads não configurado. Configure o token na página de configurações.");
    }
    
    // Verificar se o cliente existe e buscar os dados necessários
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("company_name, meta_account_id")
      .eq("id", clientId)
      .maybeSingle();
    
    if (clientError) {
      console.error("Erro ao buscar dados do cliente:", clientError);
      // Verificar se o erro está relacionado à estrutura da tabela
      if (clientError.message && clientError.message.includes("column")) {
        throw new AppError(
          "Erro na estrutura do banco de dados. Verifique as colunas na tabela clients.",
          "DATABASE_SCHEMA_ERROR", 
          { originalError: clientError }
        );
      }
      throw new Error("Erro ao buscar dados do cliente: " + clientError.message);
    }
    
    if (!clientData) {
      console.error("Cliente não encontrado:", clientId);
      throw new Error("Cliente não encontrado.");
    }
    
    if (!clientData.meta_account_id) {
      console.error("Cliente sem ID de conta Meta Ads configurado:", clientId);
      throw new Error("Cliente não possui ID de conta Meta Ads configurado. Configure o ID na página de clientes.");
    }
    
    // Preparar payload completo com todos os dados necessários
    const requestPayload = { 
      method: "getMetaAdsData", 
      clientId,
      reviewDate: formattedDate,
      clientName: clientData.company_name,
      metaAccountId: clientData.meta_account_id,
      fetchRealData: true
    };
    
    console.log("Enviando payload para função Edge:", JSON.stringify(requestPayload, null, 2));
    
    try {
      // Usar timeout para evitar que a requisição fique pendente indefinidamente
      const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao conectar à função Edge (30s)")), 30000);
      });
      
      const functionPromise = supabase.functions.invoke("daily-meta-review", {
        body: requestPayload,
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Usar uma corrida entre a promessa da função e o timeout
      const result = await Promise.race([functionPromise, timeoutPromise]);
      
      const { data, error } = result;
      
      // Verificar erro da função Edge
      if (error) {
        console.error("Erro na função Edge:", error);
        throw new AppError("Erro ao obter dados do Meta Ads: " + error.message, "EDGE_FUNCTION_ERROR", { originalError: error });
      }
      
      // Verificar resposta válida
      console.log("Resposta recebida da função Edge:", data);
      
      // Se a função Edge falhar ou não retornar dados válidos, retornar erro
      if (!data || !data.success) {
        const errorMessage = data?.error || "Resposta inválida da função Edge";
        console.error("Função Edge não retornou dados válidos:", errorMessage);
        throw new Error("Erro ao obter dados do Meta Ads: " + errorMessage);
      }
      
      // Garantir que os valores numéricos estão sendo tratados corretamente
      if (data.meta_total_spent !== undefined) {
        data.meta_total_spent = parseFloat(String(data.meta_total_spent)) || 0;
      }
      
      if (data.meta_daily_budget_current !== undefined) {
        data.meta_daily_budget_current = parseFloat(String(data.meta_daily_budget_current)) || 0;
      }
      
      // Adicionar dados do cliente para manter consistência
      data.client = {
        id: clientId,
        company_name: clientData.company_name,
        meta_account_id: clientData.meta_account_id
      };
      
      return data;
    } catch (edgeError: any) {
      console.error("Erro ao chamar função Edge:", edgeError);
      
      // NÃO usar dados simulados - retornar o erro
      throw new Error("Falha na comunicação com a função Edge: " + edgeError.message);
    }
  } catch (error: any) {
    console.error("Falha ao obter dados do Meta Ads:", error);
    throw error;
  }
};

/**
 * Chama a função Edge para análise de cliente (nome alternativo para compatibilidade)
 */
export const callEdgeFunction = async (clientId: string) => {
  const todayDate = new Date();
  const formattedDate = todayDate.toISOString().split('T')[0];
  return await invokeEdgeFunction(clientId, formattedDate);
};
