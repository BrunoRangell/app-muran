
// Cabeçalhos CORS para permitir requisições cross-origin
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
};

// Função para lidar com requisições CORS preflight (OPTIONS)
export function handleCors(req: Request) {
  // Verificar se é uma requisição OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  // Para outros métodos, retornar null para continuar o processamento
  return null;
}
