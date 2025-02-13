
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { addMonths } from "date-fns";
import { calculateMonthlyMetrics } from "./utils/calculateMonthlyMetrics";
import { Client } from "../types";

export const useMetricsData = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ["filteredClientsMetrics", dateRange],
    queryFn: async () => {
      console.log("Fetching filtered clients for period:", dateRange);
      
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching filtered clients:", error);
        throw error;
      }

      // Gera dados mensais para o período selecionado
      const months = [];
      let currentDate = new Date(dateRange.start);
      
      while (currentDate <= dateRange.end) {
        try {
          const monthData = calculateMonthlyMetrics(clients, currentDate);
          months.push(monthData);
        } catch (error) {
          console.error("Error creating month data for:", currentDate, error);
        }

        currentDate = addMonths(currentDate, 1);
      }

      console.log("Generated monthly data:", months);
      return months;
    },
  });
};
