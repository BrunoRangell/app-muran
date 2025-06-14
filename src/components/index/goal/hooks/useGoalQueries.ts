
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Goal } from "@/types/goal";
import { parseISO, isWithinInterval } from "date-fns";
import { logger } from "@/utils/logger";

export const useCurrentGoal = () => {
  return useQuery({
    queryKey: ["current-goal"],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("GOALS", "Erro ao buscar desafios", error);
        throw error;
      }

      const activeGoal = (data as Goal[]).find(goal => {
        const startDate = parseISO(goal.start_date);
        const endDate = parseISO(goal.end_date);
        return isWithinInterval(today, { start: startDate, end: endDate });
      });

      return activeGoal ? [activeGoal] : [];
    },
    retry: 2,
  });
};
