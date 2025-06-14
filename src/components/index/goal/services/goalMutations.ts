
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Goal } from "@/types/goal";
import { useToast } from "@/components/ui/use-toast";
import { parseISO } from "date-fns";
import { logger } from "@/utils/logger";

export const useFinalizeGoal = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goal, currentValue }: { goal: Goal; currentValue: number }) => {
      // Garante que temos o valor mais atualizado
      const { data: updatedGoal } = await supabase
        .from("goals")
        .select("current_value")
        .eq("id", goal.id)
        .single();

      const finalValue = updatedGoal?.current_value || currentValue;

      const { data, error } = await supabase
        .from("goals")
        .update({
          final_value: finalValue,
          status: 'completed',
          completed_at: goal.end_date // Usa a data final como data de conclusão
        })
        .eq("id", goal.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-goal"] });
      logger.info("GOALS", "Desafio finalizado com sucesso");
      toast({
        title: "🏆 Desafio finalizado!",
        description: "O desafio foi encerrado e os resultados foram registrados.",
      });
    },
    onError: (error) => {
      logger.error("GOALS", "Erro ao finalizar desafio", error);
      toast({
        title: "Erro ao finalizar desafio",
        description: "Não foi possível finalizar o desafio. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateGoal = (currentValue?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, updatedGoal }: { goalId: number; updatedGoal: Partial<Goal> }) => {
      const today = new Date();
      const endDate = parseISO(updatedGoal.end_date || '');
      
      // Se a data final for anterior a hoje, finaliza o desafio
      if (today > endDate) {
        const { data, error } = await supabase
          .from("goals")
          .update({
            ...updatedGoal,
            status: 'completed',
            final_value: currentValue || 0,
            completed_at: updatedGoal.end_date
          })
          .eq("id", goalId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Caso contrário, apenas atualiza normalmente
      const { data, error } = await supabase
        .from("goals")
        .update(updatedGoal)
        .eq("id", goalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-goal"] });
      logger.info("GOALS", "Meta atualizada com sucesso");
      toast({
        title: "🎉 Meta atualizada!",
        description: "Sua equipe está mais perto da vitória!",
      });
    },
    onError: (error) => {
      logger.error("GOALS", "Erro ao atualizar desafio", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o desafio. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useCreateGoal = (currentUserId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
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
      logger.info("GOALS", "Novo desafio criado com sucesso");
      toast({
        title: "🚀 Novo desafio criado!",
        description: "Vamos conquistar esse objetivo juntos!",
      });
    },
    onError: (error) => {
      logger.error("GOALS", "Erro ao criar desafio", error);
      toast({
        title: "Erro ao criar",
        description: error instanceof Error ? error.message : "Não foi possível criar o desafio. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};
