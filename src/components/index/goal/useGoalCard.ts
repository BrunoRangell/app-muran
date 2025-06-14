
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Goal } from "@/types/goal";
import { useToast } from "@/components/ui/use-toast";
import { parseISO, isWithinInterval } from "date-fns";
import { useGoalCalculation } from "@/hooks/useGoalCalculation";

export const useGoalCard = (isAdmin: boolean) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const { data: goals, isLoading, error: queryError } = useQuery({
    queryKey: ["current-goal"],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar desafios:", error);
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

  const goal = goals?.[0];
  const { data: currentValue, error: calculationError } = useGoalCalculation(goal);

  const finalizeGoal = useMutation({
    mutationFn: async (goalToFinalize: Goal) => {
      // Garante que temos o valor mais atualizado
      const { data: updatedGoal } = await supabase
        .from("goals")
        .select("current_value")
        .eq("id", goalToFinalize.id)
        .single();

      const finalValue = updatedGoal?.current_value || currentValue;

      const { data, error } = await supabase
        .from("goals")
        .update({
          final_value: finalValue,
          status: 'completed',
          completed_at: goalToFinalize.end_date // Usa a data final como data de conclusão
        })
        .eq("id", goalToFinalize.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-goal"] });
      toast({
        title: "🏆 Desafio finalizado!",
        description: "O desafio foi encerrado e os resultados foram registrados.",
      });
    },
    onError: (error) => {
      console.error("Erro ao finalizar desafio:", error);
      toast({
        title: "Erro ao finalizar desafio",
        description: "Não foi possível finalizar o desafio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (goal && goal.status === 'active') {
      const endDate = parseISO(goal.end_date);
      const today = new Date();
      
      if (today > endDate) {
        console.log("Finalizando desafio automaticamente:", goal.id);
        finalizeGoal.mutate(goal);
      }
    }
  }, [goal]);

  const updateGoal = useMutation({
    mutationFn: async (updatedGoal: Partial<Goal>) => {
      const today = new Date();
      const endDate = parseISO(updatedGoal.end_date || '');
      
      // Se a data final for anterior a hoje, finaliza o desafio
      if (today > endDate) {
        const { data, error } = await supabase
          .from("goals")
          .update({
            ...updatedGoal,
            status: 'completed',
            final_value: currentValue,
            completed_at: updatedGoal.end_date
          })
          .eq("id", goal?.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Caso contrário, apenas atualiza normalmente
      const { data, error } = await supabase
        .from("goals")
        .update(updatedGoal)
        .eq("id", goal?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-goal"] });
      setIsEditing(false);
      toast({
        title: "🎉 Meta atualizada!",
        description: "Sua equipe está mais perto da vitória!",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar desafio:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o desafio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createGoal = useMutation({
    mutationFn: async (newGoal: Omit<Goal, "id" | "current_value">) => {
      if (!currentUserId) throw new Error("Usuário não está logado");

      const { data, error } = await supabase
        .from("goals")
        .insert({
          ...newGoal,
          current_value: 0,
          manager_id: currentUserId,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-goal"] });
      setIsCreating(false);
      toast({
        title: "🚀 Novo desafio criado!",
        description: "Vamos conquistar esse objetivo juntos!",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar desafio:", error);
      toast({
        title: "Erro ao criar",
        description: error instanceof Error ? error.message : "Não foi possível criar o desafio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

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
