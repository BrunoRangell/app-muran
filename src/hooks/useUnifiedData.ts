/**
 * FASE 1: Hook Unificado de Dados
 * Consolidação de queries - 1 única query de clientes compartilhada
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface UnifiedClient {
  id: string;
  company_name: string;
  status: string;
  payment_type: string;
  contact_phone: string;
  contact_name: string;
  contract_value: number;
  first_payment_date: string;
  last_payment_date: string | null;
  company_birthday: string | null;
  acquisition_channel: string | null;
}

const fetchAllClients = async (): Promise<UnifiedClient[]> => {
  logger.debug("🔍 [UNIFIED] Fetching all clients with optimized query...");
  
  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name, status, payment_type, contact_phone, contact_name, contract_value, first_payment_date, last_payment_date, company_birthday, acquisition_channel')
    .order('company_name');

  if (error) {
    logger.error("❌ [UNIFIED] Error fetching clients:", error);
    throw error;
  }

  logger.info(`✅ [UNIFIED] Loaded ${data?.length || 0} clients`);
  return data || [];
};

export const useUnifiedData = () => {
  return useQuery({
    queryKey: ['unified-clients'],
    queryFn: fetchAllClients,
    staleTime: 30 * 60 * 1000, // 30 minutos - dados mudam pouco
    gcTime: 60 * 60 * 1000, // 60 minutos
    retry: 2,
  });
};
