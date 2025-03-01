
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Valida se o cliente possui as configurações necessárias para análise
 */
export const validateClient = async (clientId: string) => {
  const { toast } = useToast();
  
  // Buscar informações do cliente para validação
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  
  if (clientError || !client) {
    throw new Error("Cliente não encontrado");
  }
  
  if (!client.meta_account_id) {
    toast({
      title: "Configuração incompleta",
      description: "O cliente não possui um ID de conta Meta configurado. Por favor, configure-o primeiro.",
      variant: "destructive",
    });
    throw new Error("O cliente não possui um ID de conta Meta configurado");
  }
  
  if (!client.meta_ads_budget || client.meta_ads_budget <= 0) {
    toast({
      title: "Configuração incompleta",
      description: "O cliente não possui um orçamento Meta Ads configurado. Por favor, configure-o primeiro.",
      variant: "destructive",
    });
    throw new Error("O cliente não possui um orçamento Meta Ads configurado");
  }
  
  return client;
};
