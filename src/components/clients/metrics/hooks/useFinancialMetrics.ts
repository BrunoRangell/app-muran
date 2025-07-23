
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
    
    console.log('New date range:', newDateRange);
    setDateRange(newDateRange);
  };

  // Query centralizada que busca clientes e custos juntos
  const { data: financialData, isLoading: isLoadingFinancialData } = useQuery({
    queryKey: ["financial-data"],
    queryFn: async () => {
      console.log("Buscando dados financeiros...");
      
      // Buscar clientes e custos em paralelo
      const [clientsResult, costsResult] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("costs").select("amount")
      ]);

      if (clientsResult.error) {
        console.error("Error fetching clients:", clientsResult.error);
        throw clientsResult.error;
      }

      if (costsResult.error) {
        console.error("Error fetching costs:", costsResult.error);
        throw costsResult.error;
      }

      const clients = clientsResult.data || [];
      const costs = costsResult.data || [];

      console.log("Dados buscados:", { clients: clients.length, costs: costs.length });

      // Calcular métricas diretamente aqui
      const today = new Date();
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      const activeClients = clients.filter(client => client.status === "active");
      
      const totalClients = clients.length;
      const activeClientsCount = activeClients.length;
      const mrr = activeClients.reduce((sum, client) => sum + (client.contract_value || 0), 0);
      const arr = mrr * 12;
      const averageTicket = activeClientsCount > 0 ? mrr / activeClientsCount : 0;
      
      // Calcular retenção média
      const retentionPeriods = clients.map(client => {
        if (!client.first_payment_date) return 1;
        const startDate = new Date(client.first_payment_date);
        const endDate = client.status === "active" 
          ? today 
          : (client.last_payment_date ? new Date(client.last_payment_date) : today);
        return Math.max(Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)), 1);
      });

      const averageRetention = retentionPeriods.reduce((sum, months) => sum + months, 0) / Math.max(totalClients, 1);

      // Calcular churn rate
      const churned = clients.filter(client => 
        client.status === "inactive" && 
        client.last_payment_date && 
        new Date(client.last_payment_date) >= threeMonthsAgo
      ).length;

      const activeClientsThreeMonthsAgo = clients.filter(client => 
        client.first_payment_date && 
        new Date(client.first_payment_date) <= threeMonthsAgo &&
        (!client.last_payment_date || new Date(client.last_payment_date) > threeMonthsAgo)
      ).length;

      const churnRate = activeClientsThreeMonthsAgo > 0 
        ? (churned / activeClientsThreeMonthsAgo) * 100 
        : 0;

      const ltv = mrr * averageRetention;
      const totalCosts = costs.reduce((acc, cost) => acc + Number(cost.amount), 0);

      const metrics = {
        mrr,
        arr,
        averageRetention,
        churnRate,
        ltv,
        activeClientsCount,
        totalClients,
        averageTicket,
        totalCosts
      };

      console.log("Métricas calculadas:", metrics);

      return {
        clients,
        costs,
        metrics
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  return {
    periodFilter,
    dateRange,
    isCustomDateOpen,
    selectedMetrics,
    financialData: financialData?.metrics,
    clients: financialData?.clients,
    costs: financialData?.costs,
    isLoadingFinancialData,
    handlePeriodChange,
    setIsCustomDateOpen,
    setDateRange,
    setSelectedMetrics,
  };
};
