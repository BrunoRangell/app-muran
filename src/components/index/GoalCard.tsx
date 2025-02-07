
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, startOfToday, isWithinInterval, parseISO } from "date-fns";
import { Goal } from "@/types/goal";
import { GoalForm } from "./GoalForm";
import { GoalProgress } from "./GoalProgress";
import { useGoalCalculation } from "@/hooks/useGoalCalculation";
import { Skeleton } from "@/components/ui/skeleton";

export const GoalCard = ({ isAdmin }: { isAdmin: boolean }) => {
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

  const { data: goals, isLoading } = useQuery({
    queryKey: ["current-goal"],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filtra apenas o desafio ativo (data atual entre start_date e end_date)
      const activeGoal = (data as Goal[]).find(goal => {
        const startDate = parseISO(goal.start_date);
        const endDate = parseISO(goal.end_date);
        return isWithinInterval(today, { start: startDate, end: endDate });
      });

      return activeGoal ? [activeGoal] : [];
    },
  });

  const goal = goals?.[0];
  const { data: currentValue } = useGoalCalculation(goal);

  // Mutation para finalizar o desafio
  const finalizeGoal = useMutation({
    mutationFn: async (goalToFinalize: Goal) => {
      const { data, error } = await supabase
        .from("goals")
        .update({
          final_value: currentValue,
          status: 'completed',
          completed_at: new Date().toISOString()
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
  });

  // Verifica se o desafio precisa ser finalizado
  useEffect(() => {
    if (goal) {
      const endDate = parseISO(goal.end_date);
      const today = new Date();
      
      if (today > endDate && goal.status !== 'completed') {
        finalizeGoal.mutate(goal);
      }
    }
  }, [goal]);

  const updateGoal = useMutation({
    mutationFn: async (updatedGoal: Partial<Goal>) => {
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
    onError: () => {
      toast({
        title: "😕 Algo deu errado",
        description: "Tente novamente mais tarde.",
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
      toast({
        title: "😕 Ops, algo deu errado",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (formData: Partial<Goal>) => {
    if (isCreating) {
      createGoal.mutate(formData as Omit<Goal, "id" | "current_value">);
    } else {
      updateGoal.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <div className="flex-1">
            <p>Desafio Muran</p>
            {goal && (
              <div className="flex gap-4 items-center mt-2">
                <div className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">
                  {format(new Date(goal.start_date), 'dd/MM/yyyy')} - {format(new Date(goal.end_date), 'dd/MM/yyyy')}
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
                  {getDaysRemaining(goal.end_date) > 0 
                    ? `${getDaysRemaining(goal.end_date)} dias restantes` 
                    : "Desafio encerrado"}
                </div>
              </div>
            )}
          </div>
          {isAdmin && !isEditing && !isCreating && goal && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setIsEditing(true)}
            >
              Editar Desafio
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {isEditing || isCreating ? (
          <GoalForm
            initialData={goal}
            onSubmit={handleSave}
            onCancel={() => {
              setIsEditing(false);
              setIsCreating(false);
            }}
            isSubmitting={updateGoal.isPending || createGoal.isPending}
          />
        ) : goal ? (
          <GoalProgress goal={goal} currentValue={currentValue || 0} />
        ) : (
          <div className="text-center space-y-6 py-8">
            <div className="space-y-2">
              <Trophy className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-600">Nenhum desafio ativo</p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setIsCreating(true)}
                className="w-full max-w-xs mx-auto"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Novo Desafio
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const getDaysRemaining = (endDate: string) => {
  const today = startOfToday();
  const end = new Date(endDate);
  return differenceInDays(end, today) + 1;
};
