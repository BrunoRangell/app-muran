
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { addMonths, format } from "date-fns";
import { calculateMonthlyMetrics } from "./utils/calculateMonthlyMetrics";
import { logger } from "@/utils/logger";
import { Client } from "../types";

export const useMetricsData = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ["filteredClientsMetrics", dateRange],
    queryFn: async () => {
      logger.debug('CLIENT', 'Fetching metrics data for date range', {
        start: format(dateRange.start, 'yyyy-MM-dd'),
        end: format(dateRange.end, 'yyyy-MM-dd')
      });
      
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        logger.error('CLIENT', 'Failed to fetch clients for metrics', error);
        throw error;
      }

      if (!dateRange.start || !dateRange.end || isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
        logger.error('VALIDATION', 'Invalid date range provided', dateRange);
        return [];
      }

      // Converter para tipo Client
      const processedClients: Client[] = clients?.map(client => ({
        ...client,
        payment_type: client.payment_type as "pre" | "post",
        status: client.status as "active" | "inactive"
      })) || [];

      const months = [];
      let currentDate = new Date(dateRange.start);
      let monthCount = 0;
      
      while (currentDate <= dateRange.end && monthCount < 50) {
        try {
          const monthData = calculateMonthlyMetrics(processedClients, currentDate);
          months.push(monthData);
        } catch (error) {
          logger.error('CLIENT', `Failed to calculate metrics for month ${format(currentDate, 'yyyy-MM-dd')}`, error);
        }

        currentDate = addMonths(currentDate, 1);
        monthCount++;
      }

      logger.debug('CLIENT', 'Metrics calculation completed', { totalMonths: months.length });
      return months;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};
