
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { validateRequest, processDateRange } from "./validators.ts";
import { fetchCampaigns, fetchCampaignInsights, fetchAdSets, fetchAccountInfo } from "./api.ts";
import { calculateDailyBudgets, processCampaign } from "./budget.ts";
import { formatResponse } from "./response.ts";

serve(async (req) => {
  // Processar requisição CORS preflight se for OPTIONS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Extrair corpo da requisição
    const requestBody = await req.json();
    console.log("Meta Budget Calculator - Requisição recebida:", JSON.stringify({
      ...requestBody,
      accessToken: requestBody.accessToken ? "***TOKEN OCULTADO***" : undefined
    }));
    
    const { accountId, accessToken, dateRange } = requestBody;

    // Validar parâmetros de entrada
    const validationError = validateRequest(accountId, accessToken);
    if (validationError) {
      return validationError;
    }

    // Buscar informações da conta Meta
    const accountInfo = await fetchAccountInfo(accountId, accessToken);
    const accountName = accountInfo?.name || `Conta ${accountId}`;
    console.log(`Nome da conta: ${accountName}`);
    
    // Processar intervalo de datas
    const { effectiveDateRange, daysDiff } = processDateRange(dateRange);
    console.log(`Período de análise: ${effectiveDateRange.start} a ${effectiveDateRange.end}`);
    console.log(`Diferença em dias: ${daysDiff}`);
    
    // Buscar campanhas e insights
    const campaigns = await fetchCampaigns(accountId, accessToken);
    if (!campaigns.success) {
      return campaigns.response;
    }

    // Buscar insights de gastos para o período
    const insightsResult = await fetchCampaignInsights(
      accountId, 
      accessToken, 
      effectiveDateRange, 
      requestBody.fetchSeparateInsights
    );
    
    if (!insightsResult.success) {
      return insightsResult.response;
    }

    // Calcular orçamentos
    const budgetResult = await calculateDailyBudgets(
      campaigns.data, 
      insightsResult.totalSpent,
      accessToken,
      daysDiff
    );

    // Formatar resposta com os resultados calculados
    return formatResponse({
      accountName,
      totalDailyBudget: budgetResult.totalDailyBudget,
      totalSpent: insightsResult.totalSpent,
      campaignDetails: budgetResult.campaignDetails,
      diagnostics: {
        totalCampaigns: campaigns.data.length,
        includedItems: budgetResult.campaignDetails.length,
        skippedCampaigns: budgetResult.skippedCampaigns,
        statusCounts: budgetResult.statusCounts,
        dateRange: effectiveDateRange,
        daysPeriod: daysDiff
      }
    });

  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return new Response(
      JSON.stringify({ error: `Erro ao processar requisição: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
