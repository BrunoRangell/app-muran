import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetaClientAccount {
  id: string;
  account_id: string;
  account_name: string | null;
  client_id: string;
  client_name: string;
}

export function useMetaClientAccounts() {
  return useQuery<MetaClientAccount[]>({
    queryKey: ["meta-client-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_accounts")
        .select("id, account_id, account_name, client_id, clients!inner(id, company_name, status)")
        .eq("platform", "meta")
        .eq("status", "active")
        .not("account_id", "is", null)
        .neq("account_id", "");
      if (error) throw error;
      return (data || [])
        .filter((r: any) => r.clients?.status === "active")
        .map((r: any) => ({
          id: r.id,
          account_id: r.account_id,
          account_name: r.account_name,
          client_id: r.client_id,
          client_name: r.clients.company_name,
        }))
        .sort((a, b) => a.client_name.localeCompare(b.client_name));
    },
    staleTime: 5 * 60_000,
  });
}
