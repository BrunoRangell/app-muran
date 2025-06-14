
import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { useGoalCalculation } from "@/hooks/useGoalCalculation";
import { useCurrentGoal } from "@/components/index/goal/hooks/useGoalQueries";
import { useFinalizeGoal, useUpdateGoal, useCreateGoal } from "@/components/index/goal/services/goalMutations";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

export const useGoalCard = (isAdmin: boolean) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const { data: goals, isLoading, error: queryError } = useCurrentGoal();
  const goal = goals?.[0];
  const { data: currentValue, error: calculationError } = useGoalCalculation(goal);

  const finalizeGoal = useFinalizeGoal();
  const updateGoal = useUpdateGoal(currentValue);
  const createGoal = useCreateGoal(currentUserId);

  useEffect(() => {
    if (goal && goal.status === 'active') {
      const endDate = parseISO(goal.end_date);
      const today = new Date();
      
      if (today > endDate) {
        logger.info("GOALS", "Finalizando desafio automaticamente", { goalId: goal.id });
        finalizeGoal.mutate({ goal, currentValue });
      }
    }
  }, [goal, currentValue]);

  return {
    goal,
    currentValue,
    isLoading,
    queryError,
    isEditing,
    isCreating,
    setIsEditing,
    setIsCreating,
    updateGoal,
    createGoal,
  };
};
