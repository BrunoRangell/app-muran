
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, format } from "date-fns";
import { calculateMonthlyMetrics } from "./utils/calculateMonthlyMetrics";
import { Client } from "../types";

export const useMetricsData = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ["filteredClientsMetrics", dateRange],
    queryFn: async () => {
      console.log("=== useMetricsData Debug ===");
      console.log("Fetching filtered clients for period:", {
        start: format(dateRange.start, 'yyyy-MM-dd'),
        end: format(dateRange.end, 'yyyy-MM-dd'),
        startObj: dateRange.start,
        endObj: dateRange.end
      });
      
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching filtered clients:", error);
        throw error;
      }

      console.log("Total clients fetched:", clients?.length);

      // Validar dateRange antes de usar
      if (!dateRange.start || !dateRange.end || isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
        console.error("Invalid date range:", dateRange);
        return [];
      }

      // Gera dados mensais para o período selecionado
      const months = [];
      let currentDate = new Date(dateRange.start);
      
      console.log("Generating monthly data from", format(currentDate, 'yyyy-MM-dd'), "to", format(dateRange.end, 'yyyy-MM-dd'));
      
      let monthCount = 0;
      while (currentDate <= dateRange.end && monthCount < 50) { // Limite de segurança
        try {
          console.log(`Processing month ${monthCount + 1}:`, format(currentDate, 'yyyy-MM-dd'));
          const monthData = await calculateMonthlyMetrics(clients, currentDate);
          console.log(`Month data for ${format(currentDate, 'MMM/yy')}:`, monthData);
          months.push(monthData);
        } catch (error) {
          console.error("Error creating month data for:", format(currentDate, 'yyyy-MM-dd'), error);
        }

        currentDate = addMonths(currentDate, 1);
        monthCount++;
      }

      console.log("Generated monthly data:", months);
      console.log("Total months generated:", months.length);
      
      return months;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });
};
