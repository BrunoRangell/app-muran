
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Goal } from "@/types/goal";

export const useGoalCalculation = (goal: Goal | undefined) => {
  return useQuery({
    queryKey: ["goal-calculation", goal?.id],
    enabled: !!goal,
    queryFn: async () => {
      if (!goal) return 0;

      const { start_date, end_date, goal_type } = goal;
      let query = supabase.from("clients").select("*", { count: "exact" });

      if (goal_type === "active_clients") {
        query = query.eq("status", "active");
      } else if (goal_type === "new_clients") {
        query = query
          .eq("status", "active")
          .gte("first_payment_date", start_date)
          .lte("first_payment_date", end_date);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Erro ao calcular valor atual:", error);
        throw error;
      }

      return count || 0;
    },
  });
};

