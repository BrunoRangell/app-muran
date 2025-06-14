
import { useOptimizedPaymentsData } from "./useOptimizedPaymentsData";

// Re-exportar a versão otimizada
export const useUnifiedPaymentsData = useOptimizedPaymentsData;

// Manter compatibilidade com a interface anterior
export type { PaymentFilters } from "./useOptimizedPaymentsData";
