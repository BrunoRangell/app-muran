import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { DateRangeFilter, PeriodFilter } from "../../types";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";

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
    churnRate: false,
    newClients: false,
  });

  const handlePeriodChange = (value: PeriodFilter) => {
    console.log('Changing period to:', value);
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
    
    console.log('New date range:', newDateRange);
    setDateRange(newDateRange);
  };

  const { data: allClientsMetrics, isLoading: isLoadingAllClients } = useQuery({
    queryKey: ["allClientsMetrics"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching all clients metrics:", error);
        throw error;
      }

      return calculateFinancialMetrics(clients);
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }

      return data;
    },
  });

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
