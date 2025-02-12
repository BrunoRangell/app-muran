
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
    setPeriodFilter(value);
    const now = new Date();
    
    if (value === 'custom') {
      setIsCustomDateOpen(true);
      return;
    }
    
    switch (value) {
      case 'last-3-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -2)),
          end: endOfMonth(now)
        });
        break;
      case 'last-6-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -5)),
          end: endOfMonth(now)
        });
        break;
      case 'last-12-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -11)),
          end: endOfMonth(now)
        });
        break;
      case 'last-24-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -23)),
          end: endOfMonth(now)
        });
        break;
      case 'this-year':
        setDateRange({
          start: startOfYear(now),
          end: endOfYear(now)
        });
        break;
      case 'last-year':
        setDateRange({
          start: startOfYear(subYears(now, 1)),
          end: endOfYear(subYears(now, 1))
        });
        break;
    }
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
