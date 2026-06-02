import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveAd {
  id: string;
  name: string | null;
  status: string;
  raw_status: string;
  campaign_id: string | null;
  campaign_name: string | null;
  image_url: string | null;
}

export interface ActiveAdsResponse {
  success: boolean;
  client: { id: string; company_name: string; logo_url: string | null };
  account: { id: string; account_id: string; account_name: string | null };
  total: number;
  ads: ActiveAd[];
  error?: string;
}

export function useActiveAds(accountRowId: string | null, statuses: string[] = ["ACTIVE"]) {
  return useQuery<ActiveAdsResponse>({
    queryKey: ["active-ads", accountRowId, statuses.join(",")],
    enabled: !!accountRowId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("meta-active-ads", {
        body: { accountRowId, statuses },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao buscar anúncios");
      return data as ActiveAdsResponse;
    },
    staleTime: 60_000,
  });
}
