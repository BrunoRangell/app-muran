
// Implementação do serviço de autenticação com Meta
import { supabase } from "./supabase";

export async function getMetaToken() {
  const { data, error } = await supabase.from("meta_ads_tokens").select("*").single();

  if (error) throw error;
  if (!data) throw new Error("Token não encontrado");

  // Verifica se o token expirou
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = parseInt(data.expires_at);
  
  if (currentTime >= expirationTime) {
    const refreshedToken = await refreshToken(data.refresh_token);
    return refreshedToken;
  }

  return data.access_token;
}

async function refreshToken(refreshToken: string) {
  try {
    // Aqui implementaríamos a lógica para renovar o token usando o refresh_token
    // Como isso depende da API específica do Meta, usaremos uma implementação simplificada
    
    const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Na implementação real, você enviaria o refreshToken como parte dos parâmetros
    });
    
    const data = await response.json();
    
    // Armazenar o novo token no banco de dados
    const accessToken = data.access_token;
    const expiresInSeconds = data.expires_in;
    const expiresAtTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    
    await supabase.from("meta_ads_tokens").update({
      access_token: accessToken,
      expires_at: expiresAtTimestamp.toString(),
    }).eq("id", 1);
    
    return accessToken;
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    throw new Error("Falha ao renovar token do Meta");
  }
}

export async function exchangeCodeForToken(authorizationCode: string) {
  try {
    // Implementação simplificada da troca de código por token
    const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Na implementação real, você enviaria o authorizationCode como parte dos parâmetros
    });
    
    const data = await response.json();
    
    // Armazenar o token no banco de dados
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresInSeconds = data.expires_in;
    const expiresAtTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    
    await supabase.from("meta_ads_tokens").upsert({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAtTimestamp.toString(),
      id: 1,
    });
    
    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAtTimestamp,
    };
  } catch (error) {
    console.error("Erro na troca de código por token:", error);
    throw new Error("Falha na autenticação com Meta");
  }
}
