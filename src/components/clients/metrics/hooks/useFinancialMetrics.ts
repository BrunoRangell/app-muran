import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { DateRangeFilter, PeriodFilter } from "../../types";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";
import { useFinancialWorker } from "@/hooks/useFinancialWorker";
import { Client } from "@/components/clients/types";
import { logger } from "@/lib/logger";

export const useFinancialMetrics = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last-12-months');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const now = new Date();
    return {
      start: startOfMonth(addMonths(now, -11)),
      end: endOfMonth(now)
    };
  });
  
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    mrr: true,
    clients: false,
    churn: false,
    newClients: false,
    ltv: false,
  });

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    const now = new Date();
    
    if (value === 'custom') {
      setIsCustomDateOpen(true);
      return;
    }
    
    let newDateRange: DateRangeFilter;
    
    switch (value) {
      case 'last-3-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -2)), // -2 para incluir 3 meses (atual + 2 anteriores)
          end: endOfMonth(now)
        };
        break;
      case 'last-6-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -5)), // -5 para incluir 6 meses
          end: endOfMonth(now)
        };
        break;
      case 'last-12-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -11)), // -11 para incluir 12 meses
          end: endOfMonth(now)
        };
        break;
      case 'last-24-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -23)), // -23 para incluir 24 meses
          end: endOfMonth(now)
        };
        break;
      case 'this-year':
        newDateRange = {
          start: startOfYear(now),
          end: endOfYear(now)
        };
        break;
      case 'last-year':
        const lastYear = subYears(now, 1);
        newDateRange = {
          start: startOfYear(lastYear),
          end: endOfYear(lastYear)
        };
        break;
      default:
        newDateRange = {
          start: startOfMonth(addMonths(now, -11)),
          end: endOfMonth(now)
        };
    }
    
    setDateRange(newDateRange);
  };

  // FASE 2: Web Worker para cálculos pesados
  const { isWorkerReady, calculateMetrics } = useFinancialWorker();
  const [workerMetrics, setWorkerMetrics] = useState<any>(null);

  // FASE 1: Buscar clientes com query otimizada
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["unified-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, status, payment_type, contact_phone, contact_name, contract_value, first_payment_date, last_payment_date, company_birthday, acquisition_channel");
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // FASE 3: 30 minutos
  });

  // FASE 2: Calcular métricas com Web Worker quando clientes carregarem
  useEffect(() => {
    if (!clients || clients.length === 0 || !isWorkerReady) return;

    const calculate = async () => {
      try {
        logger.debug("🔧 [WORKER] Calculando métricas financeiras...");
        
        // FASE 4C: Select otimizado - apenas colunas necessárias
        const [paymentsResult, costsResult] = await Promise.all([
          supabase.from("payments").select("id, client_id, amount, reference_month, created_at"),
          supabase.from("costs").select("id, amount, date, name")
        ]);
        
        const result = await calculateMetrics(
          clients,
          paymentsResult.data || [],
          costsResult.data || []
        );
        
        setWorkerMetrics(result);
        logger.info("✅ [WORKER] Métricas calculadas");
      } catch (error) {
        logger.error("❌ [WORKER] Erro, usando fallback:", error);
        const fallback = await calculateFinancialMetrics(clients as Client[]);
        setWorkerMetrics(fallback);
      }
    };

    calculate();
  }, [clients, isWorkerReady, calculateMetrics]);

  const allClientsMetrics = workerMetrics;
  const isLoadingAllClients = isLoadingClients || !workerMetrics;

  return {
    periodFilter,
    dateRange,
    isCustomDateOpen,
    selectedMetrics,
    allClientsMetrics,
    isLoadingAllClients,
    clients,
    handlePeriodChange,
    setIsCustomDateOpen,
    setDateRange,
    setSelectedMetrics,
  };
};
