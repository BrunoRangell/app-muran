
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
    // Adicionar verificação para timeout e excesso de carga
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout
    
    try {
      const result = await Promise.race([
        processReviewRequest(req),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout processando a requisição")), 8000)
        )
      ]);
      
      clearTimeout(timeoutId);
      
      if (!result.success) {
        console.error("Erro ao processar requisição:", result.error);
        return formatErrorResponse(result.error || "Erro desconhecido", 500);
      }

      return formatResponse(result);
    } catch (timeoutError) {
      console.error("Timeout ou erro na execução:", timeoutError.message);
      return formatErrorResponse("Timeout processando a requisição. Tente novamente.", 504);
    }
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    return formatErrorResponse(error.message, 500);
  }
});
