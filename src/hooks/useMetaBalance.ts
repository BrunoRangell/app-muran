import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseMetaBalance } from "@/utils/metaBalance";

export interface ApiAccount {
  id: string | null;
  status_code?: any;
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

export const useMetaBalance = (accountId?: string) => {
  return useQuery({
    queryKey: ["meta-balance", accountId],
    queryFn: async (): Promise<ApiClient[]> => {
      const options = accountId ? { body: { accountId } } : {};
      const { data, error } = await supabase.functions.invoke("meta-balance", options);
      if (error) {
        console.error("Erro ao buscar saldo Meta:", error);
        throw error;
      }

      const clients = (data || []) as any[];
      return clients.map(client => {
        const meta = client.meta as any;
        if (meta) {
          const balance = parseMetaBalance(
            meta.balance,
            meta.spend_cap,
            meta.amount_spent
          );

          if (balance !== null) {
            meta.balance_type = "numeric";
            meta.balance_value = balance;
            meta.balance_source = meta.balance
              ? "display_string"
              : meta.spend_cap > 0
              ? "spend_cap_minus_spent"
              : undefined;

            if (meta.spend_cap && meta.spend_cap > 0) {
              meta.balance_percent = balance / meta.spend_cap;
            }
          } else {
            meta.balance_type = "unavailable";
          }
        }

        return client as ApiClient;
      });
    },
  });
};
