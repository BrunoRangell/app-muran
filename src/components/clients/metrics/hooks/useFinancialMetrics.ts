
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { DateRangeFilter, PeriodFilter, Client } from "../../types";
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
    
    let newDateRange: DateRangeFilter;
    
    switch (value) {
      case 'last-3-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -2)),
          end: endOfMonth(now)
        };
        break;
      case 'last-6-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -5)),
          end: endOfMonth(now)
        };
        break;
      case 'last-12-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -11)),
          end: endOfMonth(now)
        };
        break;
      case 'last-24-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -23)),
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

  const { data: allClientsMetrics, isLoading: isLoadingAllClients } = useQuery({
    queryKey: ["allClientsMetrics"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        throw error;
      }

      // Converter para tipo Client
      const processedClients: Client[] = clients?.map(client => ({
        ...client,
        payment_type: client.payment_type as "pre" | "post",
        status: client.status as "active" | "inactive"
      })) || [];

      return calculateFinancialMetrics(processedClients);
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        throw error;
      }

      // Converter para tipo Client
      const processedClients: Client[] = data?.map(client => ({
        ...client,
        payment_type: client.payment_type as "pre" | "post",
        status: client.status as "active" | "inactive"
      })) || [];

      return processedClients;
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
