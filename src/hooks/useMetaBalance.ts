import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      return (data || []) as ApiClient[];
    },
  });
};
