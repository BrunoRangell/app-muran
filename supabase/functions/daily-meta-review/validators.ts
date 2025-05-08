
/**
 * Validar requisição HTTP
 */
export function validateRequest(req: Request): string | null {
  // Verificar se o método é POST
  if (req.method !== 'POST') {
    return "Método não permitido. Use POST.";
  }
  
  // Verificar Content-Type
  const contentType = req.headers.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    return "Content-Type deve ser application/json";
  }
  
  return null;
}

/**
 * Validar ID de cliente
 */
export function validateClientId(clientId: string): string | null {
  if (!clientId) {
    return "ID do cliente é obrigatório";
  }
  
  // Verificar formato UUID válido para clientId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(clientId)) {
    return "ID do cliente deve ser um UUID válido";
  }
  
  return null;
}
