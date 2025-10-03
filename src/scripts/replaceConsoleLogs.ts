/**
 * Script para substituir console.log por logger em todo o projeto
 * Fase 2A: Limpeza Automática de Logs
 */

import { logger } from "@/lib/logger";

// Este arquivo documenta o padrão de substituição que deve ser seguido
// em todo o codebase:

// ❌ ANTES (errado):
// console.log("mensagem", data);
// console.info("info");
// console.warn("warning");
// console.error("erro", error);

// ✅ DEPOIS (correto):
// logger.debug("mensagem", data);  // para debug/desenvolvimento
// logger.info("info");              // para informações gerais
// logger.warn("warning");           // para avisos
// logger.error("erro", error);      // para erros

/**
 * Padrões de substituição:
 * 
 * 1. console.log -> logger.debug (apenas em dev)
 * 2. console.info -> logger.info
 * 3. console.warn -> logger.warn
 * 4. console.error -> logger.error
 * 5. console.debug -> logger.debug
 */

export const REPLACEMENT_PATTERNS = {
  "console.log": "logger.debug",
  "console.info": "logger.info",
  "console.warn": "logger.warn",
  "console.error": "logger.error",
  "console.debug": "logger.debug",
} as const;

/**
 * Arquivos prioritários para limpeza (identificados na análise):
 */
export const PRIORITY_FILES = [
  "src/utils/unifiedLTVCalculations.ts",
  "src/components/campaign-health/hooks/useActiveCampaignHealth.ts",
  "src/components/campaign-health/hooks/useCampaignHealthData.ts",
  "src/components/campaign-health/hooks/useIntelligentAnalysis.ts",
  "src/components/improved-reviews/hooks/useClientAnalysis.tsx",
  "src/components/improved-reviews/hooks/useClientFiltering.ts",
  "src/components/improved-reviews/hooks/useBatchOperations.ts",
  "src/components/daily-reviews/client-details/useClientReviewDetails.ts",
  "src/components/financial-dashboard/components/MetricsBarExplorer.tsx",
] as const;

/**
 * Nota: A substituição manual está sendo feita de forma incremental
 * nos arquivos mais críticos primeiro, seguindo a ordem de prioridade.
 */
