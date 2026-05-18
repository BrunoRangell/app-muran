import { useQuery } from "@tanstack/react-query";

export interface MetaVideoSource {
  video_id: string;
  source: string | null;
  permalink_url: string | null;
  picture: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function useMetaVideoSource(videoId?: string, enabled = true) {
  return useQuery<MetaVideoSource>({
    queryKey: ["meta-video-source", videoId],
    enabled: !!videoId && enabled,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 12,
    retry: 1,
    queryFn: async () => {
      const url = `${SUPABASE_URL}/functions/v1/meta-video-source?video_id=${encodeURIComponent(videoId!)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`meta-video-source ${res.status}: ${txt}`);
      }
      return (await res.json()) as MetaVideoSource;
    },
  });
}
