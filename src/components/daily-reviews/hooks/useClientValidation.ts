
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast"; // Importação correta

// Função de validação do cliente
export const validateClient = async (clientId: string) => {
  if (!clientId) {
    throw new Error("ID do cliente é necessário");
  }

  // Buscar dados do cliente no Supabase
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar o cliente: ${error.message}`);
  }

  if (!client) {
    throw new Error("Cliente não encontrado");
  }

  // Validar se o cliente possui um ID de conta e orçamento configurados
  if (!client.meta_account_id) {
    throw new Error("O ID da conta Meta não está configurado para este cliente");
  }

  if (!client.meta_ads_budget || client.meta_ads_budget <= 0) {
    throw new Error("O orçamento de anúncios Meta não está configurado para este cliente");
  }

  return client;
};
