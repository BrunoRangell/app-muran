
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Obtém o token de acesso Meta do banco de dados
 */
export const getMetaAccessToken = async (): Promise<string | null> => {
  console.log("Buscando token de acesso Meta...");
  
  try {
    const { data, error } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "Meta Ads")
      .single();
    
    if (error) {
      console.error("Erro ao buscar token Meta:", error);
      throw error;
    }
    
    if (!data || !data.value) {
      console.error("Token Meta não encontrado");
      return null;
    }
    
    console.log("Token Meta encontrado");
    return data.value;
  } catch (error) {
    console.error("Erro ao buscar token:", error);
    return null;
  }
};

/**
 * Hook para interagir com funções de borda
 */
export const useEdgeFunction = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  
  /**
   * Chama a função de borda Meta Budget Calculator
   */
  const callMetaBudgetEdgeFunction = async (args: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Chamando função Edge com argumentos:", args);
      
      // Obter token Meta
      const token = await getMetaAccessToken();
      if (!token) {
        throw new Error("Token Meta não encontrado");
      }
      
      // Chamar a função de borda
      const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
        body: {
          ...args,
          accessToken: token
        }
      });
      
      if (error) {
        console.error("Erro na chamada da função Edge:", error);
        throw error;
      }
      
      console.log("Resultado da função Edge:", data);
      setIsLoading(false);
      return { data };
      
    } catch (err: any) {
      console.error("Erro ao chamar função Edge:", err);
      setError(err);
      setIsLoading(false);
      
      toast({
        title: "Erro na análise",
        description: err.message || "Falha ao processar a requisição",
        variant: "destructive"
      });
      
      return { error: err };
    }
  };
  
  return {
    callMetaBudgetEdgeFunction,
    isLoading,
    error
  };
};
