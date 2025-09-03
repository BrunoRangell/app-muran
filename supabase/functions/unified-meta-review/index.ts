import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors } from "./cors.ts";
import { formatResponse } from "./response-formatter.ts";
import { processIndividualReview } from "./individual.ts";
import { processBatchReview } from "./batch.ts";
import { processAccountHealth } from "./account-health.ts";
import { processBudgetCalculation } from "./budget-calculation.ts";
import { IndividualReviewRequest, BatchReviewRequest } from "./types.ts";

// Handler principal da função unificada
serve(async (req: Request) => {
  // Tratar CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Implementar rate limiting básico
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  console.log(`🚀 [UNIFIED-REVIEW] Request from IP: ${clientIP}`);

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return formatResponse(405, { success: false, error: "Método não permitido" });
    }

    // Validar Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return formatResponse(400, { success: false, error: "Content-Type deve ser application/json" });
    }

    // Validar tamanho do body
    const body = await req.text();
    if (body.length > 50000) { // 50KB limit para suportar batch
      return formatResponse(413, { success: false, error: "Payload muito grande" });
    }

    // Validar JSON
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return formatResponse(400, { success: false, error: "JSON inválido" });
    }

    // Detectar tipo de requisição
    const isIndividualReview = !!payload.clientId && !payload.clientIds;
    const isBatchReview = !!payload.clientIds && Array.isArray(payload.clientIds);
    const isAccountHealth = !!payload.accountId && !payload.clientId && !payload.clientIds;
    const isBudgetCalculation = !!payload.accountId && !!payload.accessToken && !payload.clientId && !payload.clientIds;
    
    console.log(`🔍 [UNIFIED-REVIEW] Dados recebidos:`, {
      hasClientId: !!payload.clientId,
      hasClientIds: !!payload.clientIds,
      hasAccountId: !!payload.accountId,
      hasAccessToken: !!payload.accessToken,
      isBatch: isBatchReview,
      isHealth: isAccountHealth,
      isBudget: isBudgetCalculation,
      reviewDate: payload.reviewDate || 'hoje',
      timestamp: new Date().toISOString()
    });

    let result;
    if (isBudgetCalculation) {
      console.log(`💰 [UNIFIED-REVIEW] Processando CÁLCULO DE ORÇAMENTO`);
      result = await processBudgetCalculation(payload);
    } else if (isAccountHealth) {
      console.log(`🏥 [UNIFIED-REVIEW] Processando HEALTH de conta individual`);
      result = await processAccountHealth(payload.accountId);
    } else if (isIndividualReview) {
      console.log(`👤 [UNIFIED-REVIEW] Processando revisão INDIVIDUAL`);
      result = await processIndividualReview(payload as IndividualReviewRequest);
    } else if (isBatchReview) {
      console.log(`👥 [UNIFIED-REVIEW] Processando revisão EM LOTE`);
      result = await processBatchReview(payload as BatchReviewRequest);
    } else {
      console.error(`❌ [UNIFIED-REVIEW] Tipo de requisição não identificado`);
      return formatResponse(400, { success: false, error: "Parâmetros inválidos" });
    }
    
    if (!result.success) {
      return formatResponse(500, result);
    }

    return formatResponse(200, result);
  } catch (error) {
    console.error("❌ [UNIFIED-REVIEW] Erro na função:", error.message);
    
    // Log para monitoramento de segurança
    console.error("Security log:", {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      error: error.message,
      url: req.url,
      method: req.method
    });
    
    return formatResponse(500, { success: false, error: "Erro interno do servidor" });
  }
});