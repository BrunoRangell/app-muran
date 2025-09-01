import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseMetaBalance } from "@/utils/metaBalance";

interface FundingEvent {
  event_time?: string;
  created_time?: string;
  time_created?: string;
  timestamp?: string;
  date?: string;
  amount?: number | string | { value?: number; amount?: number };
  value?: number | string;
}

export interface ApiAccount {
  id: string | null;
  account_name?: string;
  status_code?: unknown;
  status_label: string;
  status_tone: "ok" | "warn" | "crit" | "info";
  billing_model: "pre" | "pos";
  is_prepay_account?: boolean;
  balance_type: "numeric" | "credit_card" | "unavailable";
  balance_value?: number | null;
  balance_source?: string;
  balance_percent?: number;
  spend_cap?: number | string | null;
  amount_spent?: number | string | null;
  expired_funding_source_details?: { display_string?: string } | null;
  last_recharge_date?: string;
  last_recharge_amount?: number;
  last_funding_event?: FundingEvent;
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

        const clients = (data || []) as ApiClient[];
        return clients.map(client => {
          const meta = client.meta;
          if (meta) {
          // Definir billing_model baseado em is_prepay_account
          meta.billing_model = meta.is_prepay_account ? "pre" : "pos";
          
          if (meta.is_prepay_account === false) {
            meta.balance_type = "credit_card";
            meta.balance_value = null;
            meta.balance_percent = undefined;
          } else {
            const spendCap =
              meta.spend_cap !== undefined && meta.spend_cap !== null
                ? Number(meta.spend_cap) / 100
                : undefined;
            const amountSpent =
              meta.amount_spent !== undefined && meta.amount_spent !== null
                ? Number(meta.amount_spent) / 100
                : undefined;

            meta.spend_cap = spendCap;
            meta.amount_spent = amountSpent;

            const balance = parseMetaBalance(
              meta.expired_funding_source_details?.display_string,
              spendCap,
              amountSpent
            );

            if (balance !== null) {
              meta.balance_type = "numeric";
              meta.balance_value = balance;
              meta.balance_source = meta.expired_funding_source_details?.display_string
                ? "display_string"
                : spendCap && spendCap > 0
                ? "spend_cap_minus_spent"
                : undefined;

              if (spendCap && spendCap > 0) {
                meta.balance_percent = balance / spendCap;
              }
            } else {
              meta.balance_type = "unavailable";
            }
          }

          if (meta.last_funding_event) {
            const event = meta.last_funding_event;
            const date =
              event?.event_time ||
              event?.created_time ||
              event?.time_created ||
              event?.timestamp ||
              event?.date;
            const amountRaw =
              (typeof event?.amount === "object"
                ? event.amount?.value ?? event.amount?.amount
                : event?.amount) ?? event?.value;
            if (date && amountRaw !== undefined && amountRaw !== null) {
              meta.last_recharge_date = String(date).split("T")[0];
              const amt =
                typeof amountRaw === "number" ? amountRaw : parseFloat(amountRaw);
              if (!isNaN(amt)) {
                meta.last_recharge_amount = amt / 100;
              }
            }
          }
        }

        return client as ApiClient;
      });
    },
  });
};
