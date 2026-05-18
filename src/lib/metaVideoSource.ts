import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetaVideoSource {
  video_id: string;
  source: string | null;
  permalink_url: string | null;
  picture: string | null;
}

export function useMetaVideoSource(videoId?: string, enabled = true) {
  return useQuery<MetaVideoSource>({
    queryKey: ["meta-video-source", videoId],
    enabled: !!videoId && enabled,
    staleTime: 1000 * 60 * 60 * 6, // 6h
    gcTime: 1000 * 60 * 60 * 12,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<MetaVideoSource>(
        `meta-video-source?video_id=${encodeURIComponent(videoId!)}`,
        { method: "GET" }
      );
      if (error) throw error;
      if (!data) throw new Error("Resposta vazia");
      return data;
    },
  });
}
