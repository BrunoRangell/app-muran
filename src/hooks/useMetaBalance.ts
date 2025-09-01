import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApiAccount {
  id: string | null;
  account_name?: string;
  status_code: unknown;
  status_label: string;
  status_tone: "ok" | "warn" | "crit" | "info";
  billing_model: "pre" | "pos";
  balance_type: "numeric" | "credit_card" | "unavailable";
  balance_value?: number;
  balance_source?: string;
  balance_percent?: number;
  last_recharge_date?: string;
  last_recharge_amount?: number;
  badges?: string[];
}

export interface ApiClient {
  client: string;
  meta?: ApiAccount;
  google?: ApiAccount;
}

export function useMetaBalance() {
  return useQuery({
    queryKey: ["meta-balance-consolidated"],
    queryFn: async (): Promise<ApiClient[]> => {
      console.log("🔍 Buscando dados consolidados de saldo...");
      
      // Buscar clientes ativos com suas contas Meta
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          status
        `)
        .eq("status", "active");

      if (clientsError) {
        console.error("❌ Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Buscar contas Meta
      const { data: metaAccounts, error: metaError } = await supabase
        .from("client_accounts")
        .select("*")
        .eq("platform", "meta")
        .eq("status", "active");

      if (metaError) {
        console.error("❌ Erro ao buscar contas Meta:", metaError);
        throw metaError;
      }

      // Mapear dados para o formato esperado
      const result: ApiClient[] = [];
      
      clients?.forEach(client => {
        const metaAccount = metaAccounts?.find(acc => acc.client_id === client.id);
        
        if (metaAccount) {
          const apiAccount: ApiAccount = {
            id: metaAccount.account_id,
            account_name: metaAccount.account_name,
            status_code: 200,
            status_label: "Ativa",
            status_tone: "ok",
            billing_model: metaAccount.is_prepay_account ? "pre" : "pos",
            balance_type: metaAccount.saldo_restante !== null ? "numeric" : "unavailable",
            balance_value: metaAccount.saldo_restante || undefined,
            balance_percent: metaAccount.saldo_restante ? Math.min(1, metaAccount.saldo_restante / 1000) : 0,
          };

          result.push({
            client: client.company_name,
            meta: apiAccount
          });
        } else {
          // Cliente sem conta Meta
          result.push({
            client: client.company_name
          });
        }
      });

      console.log("✅ Dados consolidados processados:", result.length);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: false,
  });
}