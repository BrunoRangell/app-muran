
// Função para obter o token da API Meta
export async function getMetaToken(): Promise<string | null> {
  try {
    // Recuperar o token do localStorage
    const token = localStorage.getItem("meta_access_token");
    
    if (!token) {
      console.warn("Token de acesso Meta não encontrado no localStorage");
      return null;
    }
    
    return token;
  } catch (error) {
    console.error("Erro ao recuperar token Meta:", error);
    return null;
  }
}

// Função para verificar se o token existe
export function hasMetaToken(): boolean {
  return localStorage.getItem("meta_access_token") !== null;
}

// Função para salvar o token na localStorage
export function saveMetaToken(token: string): void {
  localStorage.setItem("meta_access_token", token);
}

// Função para limpar o token
export function clearMetaToken(): void {
  localStorage.removeItem("meta_access_token");
}
