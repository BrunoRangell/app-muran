
// Formatação de respostas
export function formatResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      status: 200,
    },
  );
}

export function formatErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      status,
    },
  );
}
