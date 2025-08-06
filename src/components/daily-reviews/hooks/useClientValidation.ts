
import { supabase } from "@/integrations/supabase/client";
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

  // Validar se o cliente possui conta Meta através da tabela client_accounts
  const { data: metaAccount } = await supabase
    .from('client_accounts')
    .select('account_id, budget_amount')
    .eq('client_id', clientId)
    .eq('platform', 'meta')
    .eq('is_primary', true)
    .single();

  if (!metaAccount?.account_id) {
    throw new Error("O ID da conta Meta não está configurado para este cliente");
  }

  if (!metaAccount.budget_amount || metaAccount.budget_amount <= 0) {
    throw new Error("O orçamento de anúncios Meta não está configurado para este cliente");
  }

  return client;
};
