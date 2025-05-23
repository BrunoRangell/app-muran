
// Formato padronizado para respostas de sucesso
export function formatResponse(data: any) {
  const responseBody = JSON.stringify({
    success: true,
    data
  });

  return new Response(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

// Formato padronizado para respostas de erro
export function formatErrorResponse(message: string, status: number = 400) {
  const responseBody = JSON.stringify({
    success: false,
    error: message
  });

  return new Response(responseBody, {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
