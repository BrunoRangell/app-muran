import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Gauge, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Goal } from "@/types/goal";
import { GoalForm } from "./GoalForm";
import { GoalProgress } from "./GoalProgress";
import { useGoalCalculation } from "@/hooks/useGoalCalculation";

export const GoalCard = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editedGoal, setEditedGoal] = useState<Partial<Goal>>({});

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("ID do usuário atual:", user?.id);
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["current-goal"],
    queryFn: async () => {
      console.log("Buscando meta atual...");
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Erro ao buscar meta:", error);
        throw error;
      }

      console.log("Metas encontradas:", data);
      return data as Goal[];
    },
  });

  const goal = goals?.[0];
  const { data: currentValue } = useGoalCalculation(goal);

  const updateGoal = useMutation({
    mutationFn: async (updatedGoal: Partial<Goal>) => {
      console.log("Atualizando meta...", updatedGoal);
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
        title: "Meta atualizada com sucesso!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar meta:", error);
      toast({
        title: "Erro ao atualizar meta",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const createGoal = useMutation({
    mutationFn: async (newGoal: Omit<Goal, "id" | "current_value">) => {
      if (!currentUserId) {
        throw new Error("Usuário não está logado");
      }
      
      console.log("Criando nova meta...", { ...newGoal, manager_id: currentUserId });
      const { data, error } = await supabase
        .from("goals")
        .insert({ 
          ...newGoal, 
          current_value: 0,
          manager_id: currentUserId 
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
        title: "Meta criada com sucesso!",
        description: "A nova meta foi adicionada.",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar meta:", error);
      toast({
        title: "Erro ao criar meta",
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
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedDateRange = goal 
    ? `${format(new Date(goal.start_date), 'dd/MM')} até ${format(new Date(goal.end_date), 'dd/MM')}`
    : '';

  const renderContent = () => {
    if (isEditing || isCreating) {
      return (
        <GoalForm
          initialData={editedGoal}
          onSubmit={handleSave}
          onCancel={() => {
            setIsEditing(false);
            setIsCreating(false);
            setEditedGoal({});
          }}
          isSubmitting={updateGoal.isPending || createGoal.isPending}
        />
      );
    }

    if (!goal) {
      return (
        <div className="text-center space-y-4">
          <p className="text-gray-600">Nenhuma meta definida</p>
          {isAdmin && (
            <Button
              onClick={() => {
                setIsCreating(true);
                setEditedGoal({});
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Meta
            </Button>
          )}
        </div>
      );
    }

    return <GoalProgress goal={goal} currentValue={currentValue || 0} />;
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="text-muran-primary h-5 w-5" />
          Meta Atual {goal && `- ${formattedDateRange}`}
          {isAdmin && !isEditing && !isCreating && goal && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setIsEditing(true);
                setEditedGoal({
                  goal_type: goal.goal_type,
                  start_date: goal.start_date,
                  end_date: goal.end_date,
                  target_value: goal.target_value,
                });
              }}
            >
              Editar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">{renderContent()}</CardContent>
    </Card>
  );
};