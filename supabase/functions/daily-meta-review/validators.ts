
import { corsHeaders } from "./cors.ts";

// Validar parâmetros da requisição
export function validateRequest(clientId: string) {
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "ID do cliente não fornecido" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  return null;
}

// Função para processar o intervalo de datas
export function processDateRange(dateRange?: { start: string; end: string }) {
  // Se não foi fornecido dateRange, usar o mês atual
  const effectiveDateRange = dateRange || {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  // Calcular a diferença em dias para o diagnóstico
  const daysDiff = calculateDaysDiff(effectiveDateRange.start, effectiveDateRange.end);
  
  return { effectiveDateRange, daysDiff };
}

// Função auxiliar para calcular a diferença em dias entre duas datas
export function calculateDaysDiff(startDate: string, endDate: string) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Garantir que nunca seja zero
  } catch (error) {
    console.error(`Erro ao calcular diferença de dias entre ${startDate} e ${endDate}:`, error);
    return 1; // Valor padrão seguro
  }
}
