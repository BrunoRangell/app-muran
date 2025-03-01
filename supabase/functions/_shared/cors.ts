
// Cabeçalhos CORS padronizados para todas as funções Edge
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Função auxiliar para criar respostas com CORS
export function createCorsResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Resposta para requisições OPTIONS (preflight CORS)
export function handleCorsPreflightRequest() {
  return new Response(null, {
    status: 204, // No content
    headers: corsHeaders,
  });
}

// Função auxiliar para criar respostas de erro com CORS
export function createErrorResponse(message: string, status = 500, details?: any) {
  console.error(`[Error ${status}] ${message}`, details || '');
  
  return createCorsResponse({
    success: false,
    message,
    error: details ? { details } : undefined,
  }, status);
}
