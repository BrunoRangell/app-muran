
import { corsHeaders } from "./cors.ts";

// Função para formatar respostas de sucesso
export const formatResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
};

// Função para formatar respostas de erro
export const formatErrorResponse = (message: string, status: number = 400) => {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
};
