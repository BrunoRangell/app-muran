import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useLTVBatch = (targetMonths: Date[]) => {
  return useQuery({
    queryKey: ["ltv-batch", targetMonths.map(d => format(d, 'yyyy-MM'))],
    staleTime: 30 * 60 * 1000, // 30 minutos de cache
    enabled: targetMonths.length > 0,
    queryFn: async () => {
      const monthStrings = targetMonths.map(date => format(date, 'yyyy-MM'));

      const { data, error } = await supabase.functions.invoke('calculate-ltv-batch', {
        body: { targetMonths: monthStrings }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao calcular LTV');

      return data.ltvValues as Record<string, number>;
    },
  });
};
