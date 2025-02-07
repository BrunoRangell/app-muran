
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

      // Atualiza o current_value no banco de dados
      if (count !== goal.current_value) {
        const { error: updateError } = await supabase
          .from("goals")
          .update({ current_value: count })
          .eq("id", goal.id);

        if (updateError) {
          console.error("Erro ao atualizar current_value:", updateError);
        }
      }

      return count || 0;
    },
  });
};
