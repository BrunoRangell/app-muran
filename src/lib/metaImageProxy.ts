/**
 * Envolve uma URL de imagem da Meta (fbcdn / facebook / instagram CDN)
 * com o proxy edge function, garantindo CORS e cacheabilidade.
 * Para URLs não-Meta, retorna como está.
 */
const META_HOST_HINTS = ['fbcdn.net', 'facebook.com', 'akamaihd.net', 'cdninstagram.com'];

export function proxiedImageUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const u = new URL(rawUrl);
    const isMeta = META_HOST_HINTS.some((h) => u.hostname.endsWith(h));
    if (!isMeta) return rawUrl;

    const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!base) return rawUrl;
    return `${base}/functions/v1/meta-image-proxy?url=${encodeURIComponent(rawUrl)}`;
  } catch {
    return rawUrl;
  }
}
