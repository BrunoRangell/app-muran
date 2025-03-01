
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { calculateTotalSpend } from "./campaignProcessor";

/**
 * Valida e sanitiza o resultado da análise
 */
export const validateAnalysisResult = (result: any): SimpleAnalysisResult => {
  console.log("[responseValidator] Validando resposta da API");
  
  // Verificação básica da estrutura da resposta
  if (!result) {
    console.error("[responseValidator] Resposta vazia ou inválida");
    throw new Error("Resposta inválida ou vazia da API");
  }
  
  // Garantir que temos a propriedade meta
  if (!result.meta) {
    console.error("[responseValidator] Resposta sem propriedade 'meta'");
    result.meta = {};
  }
  
  // Garantir que temos um array de campanhas
  if (!result.meta.campaigns || !Array.isArray(result.meta.campaigns)) {
    console.warn("[responseValidator] Propriedade 'campaigns' ausente ou inválida");
    result.meta.campaigns = [];
  }
  
  // Sanitizar campos numéricos
  result.meta.totalSpent = sanitizeNumericValue(result.meta.totalSpent);
  result.meta.dailyBudget = sanitizeNumericValue(result.meta.dailyBudget);
  
  // Verificar se temos dados de intervalo de datas
  if (!result.meta.dateRange) {
    console.warn("[responseValidator] Propriedade 'dateRange' ausente");
    result.meta.dateRange = {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };
  }
  
  // Verificar se o total reportado está correto
  const calculatedTotal = calculateTotalSpend(result.meta.campaigns);
  
  // Se o total reportado for zero ou inexistente, mas temos gastos nas campanhas,
  // use o total calculado
  if (result.meta.totalSpent === 0 && calculatedTotal > 0) {
    console.log("[responseValidator] Atualizando total reportado para o calculado:", calculatedTotal);
    result.meta.totalSpent = calculatedTotal;
  }
  
  console.log("[responseValidator] Validação concluída:", {
    totalSpent: result.meta.totalSpent,
    dailyBudget: result.meta.dailyBudget,
    campaigns: result.meta.campaigns.length
  });
  
  return result as SimpleAnalysisResult;
};

/**
 * Converte e sanitiza um valor para número válido
 */
export const sanitizeNumericValue = (value: any): number => {
  if (value === undefined || value === null) return 0;
  
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  if (typeof value === 'object') {
    // Tentar encontrar um valor numérico dentro do objeto
    if (value.value !== undefined) return sanitizeNumericValue(value.value);
    if (value.amount !== undefined) return sanitizeNumericValue(value.amount);
    if (value.total !== undefined) return sanitizeNumericValue(value.total);
  }
  
  return 0;
};
