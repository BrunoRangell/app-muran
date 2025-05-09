
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processReviewRequest } from "./processor.ts";
import { handleCors, corsHeaders } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";

// Handler principal da função
serve(async (req: Request) => {
  // Tratar CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    console.log("Recebida requisição para daily-meta-review");
    
    // Para debugging, verificar se é uma requisição de ping simples
    if (req.method === 'GET' || (req.headers.get('content-type') === 'application/json' && req.body)) {
      try {
        const body = await req.clone().json();
        if (body.method === 'ping' || body.test === true) {
          console.log("Requisição de teste/ping recebida");
          return formatResponse({
            success: true,
            message: "Edge Function ativa e respondendo",
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        // Ignorar erros ao tentar parsear corpo da requisição
        console.log("Não foi possível parsear corpo da requisição como JSON");
      }
    }
    
    const result = await processReviewRequest(req);
    
    // Verificar se o resultado já é uma Response
    if (result instanceof Response) {
      return result;
    }
    
    if (!result.success) {
      return formatErrorResponse(result.error || "Erro desconhecido", 500);
    }

    return formatResponse(result);
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    return formatErrorResponse(`Erro na função Edge: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
});
