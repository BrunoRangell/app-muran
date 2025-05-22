
import { corsHeaders } from "./cors.ts";

// Função para formatar respostas de sucesso
export function formatResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Função para formatar respostas de erro
export function formatErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
