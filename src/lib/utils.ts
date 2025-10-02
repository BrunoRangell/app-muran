import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Otimiza URLs de imagens do Supabase/Lovable adicionando parâmetros de transformação
 * para servir imagens responsivas e reduzir o tamanho do download
 * @param url - URL original da imagem
 * @param width - Largura desejada em pixels (padrão: 200 para avatares)
 * @param quality - Qualidade da imagem 1-100 (padrão: 80)
 * @returns URL otimizada com parâmetros de transformação
 */
export function optimizeImageUrl(url: string | null | undefined, width: number = 200, quality: number = 80): string {
  if (!url) return '';
  
  // Se for uma URL do Lovable uploads, adicionar parâmetros de otimização
  if (url.includes('lovable-uploads') || url.includes('lovable.app')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
  }
  
  // Se for uma URL do Supabase Storage, usar a API de transformação
  if (url.includes('supabase') && url.includes('/storage/')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}`;
  }
  
  // Para outras URLs (Google Drive, etc), retornar como está
  return url;
}
