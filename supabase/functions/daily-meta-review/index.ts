
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
    const result = await processReviewRequest(req);
    
    if (!result.success) {
      return formatErrorResponse(result.error || "Erro desconhecido", 500);
    }

    return formatResponse(result);
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    return formatErrorResponse(error.message, 500);
  }
});
