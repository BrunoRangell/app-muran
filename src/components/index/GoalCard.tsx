import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Gauge } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Goal {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  target_value: number;
  current_value: number;
}

export const GoalCard = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: goal, isLoading } = useQuery({
    queryKey: ["current-goal"],
    queryFn: async () => {
      console.log("Buscando meta atual...");
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Erro ao buscar meta:", error);
        throw error;
      }

      console.log("Meta encontrada:", data);
      return data as Goal;
    },
  });

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

  const [editedGoal, setEditedGoal] = useState<Partial<Goal>>({});

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

  if (!goal) return null;

  const progress = Math.min(
    Math.round((goal.current_value / goal.target_value) * 100),
    100
  );

  const handleSave = () => {
    updateGoal.mutate(editedGoal);
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="text-muran-primary h-5 w-5" />
          Meta Atual
          {isAdmin && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setIsEditing(true);
                setEditedGoal({
                  name: goal.name,
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
      <CardContent className="p-4 pt-0">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              placeholder="Nome da meta"
              value={editedGoal.name || ""}
              onChange={(e) =>
                setEditedGoal({ ...editedGoal, name: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={editedGoal.start_date || ""}
                onChange={(e) =>
                  setEditedGoal({ ...editedGoal, start_date: e.target.value })
                }
              />
              <Input
                type="date"
                value={editedGoal.end_date || ""}
                onChange={(e) =>
                  setEditedGoal({ ...editedGoal, end_date: e.target.value })
                }
              />
            </div>
            <Input
              type="number"
              placeholder="Valor da meta"
              value={editedGoal.target_value || ""}
              onChange={(e) =>
                setEditedGoal({
                  ...editedGoal,
                  target_value: parseFloat(e.target.value),
                })
              }
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateGoal.isPending}
                className="w-full"
              >
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold">{goal.name}</h3>
            <p className="text-sm text-gray-600">
              {new Date(goal.start_date).toLocaleDateString()} até{" "}
              {new Date(goal.end_date).toLocaleDateString()}
            </p>
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-gray-600 text-right">
                {progress}% concluído
              </p>
            </div>
            <p className="text-sm">
              <span className="font-medium">
                R$ {goal.current_value.toLocaleString("pt-BR")}
              </span>{" "}
              / R$ {goal.target_value.toLocaleString("pt-BR")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};