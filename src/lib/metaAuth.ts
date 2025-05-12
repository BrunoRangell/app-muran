
import { supabase } from "./supabase";

/**
 * Obtém um token de acesso Meta válido
 */
export async function getMetaAccessToken(): Promise<string | null> {
  try {
    // Verificar se há um token em localStorage e se ainda é válido
    const storedToken = localStorage.getItem("meta_access_token");
    const expiresAt = localStorage.getItem("meta_token_expires_at");
    
    // Se o token existe e não expirou, retornar
    if (storedToken && expiresAt) {
      const expiryTime = parseInt(expiresAt, 10);
      const now = Math.floor(Date.now() / 1000);
      
      // Se o token ainda é válido (com 5 minutos de margem)
      if (expiryTime > now + 300) {
        return storedToken;
      }
    }
    
    // Caso contrário, solicitar um novo token
    const { data, error } = await supabase.functions.invoke("get-meta-access-token", {});
    
    if (error) {
      console.error("Erro ao obter token de acesso Meta:", error);
      return null;
    }
    
    if (!data?.access_token) {
      console.error("Token de acesso Meta não retornado");
      return null;
    }
    
    // Armazenar o novo token e expiração
    localStorage.setItem("meta_access_token", data.access_token);
    
    // Calcular e armazenar a expiração (em segundos desde o epoch)
    const expiresIn = data.expires_in || 3600; // Padrão: 1 hora
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    localStorage.setItem("meta_token_expires_at", expiresAt.toString());
    
    return data.access_token;
  } catch (error) {
    console.error("Erro ao processar token de acesso Meta:", error);
    return null;
  }
}
