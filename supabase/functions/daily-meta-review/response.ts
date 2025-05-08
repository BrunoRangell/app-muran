
import { corsHeaders } from "./cors.ts";

/**
 * Formatar resposta de sucesso
 */
export function formatResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    }
  );
}

/**
 * Formatar resposta de erro
 */
export function formatErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status,
    }
  );
}
