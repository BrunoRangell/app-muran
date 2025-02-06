import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Gauge, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Goal {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  target_value: number;
  current_value: number;
  manager_id: string;
}

export const GoalCard = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Buscar ID do usuário logado
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

  const handleSave = () => {
    if (isCreating) {
      createGoal.mutate(editedGoal as Omit<Goal, "id" | "current_value">);
    } else {
      updateGoal.mutate(editedGoal);
    }
  };

  const renderContent = () => {
    if (isEditing || isCreating) {
      return (
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
              disabled={updateGoal.isPending || createGoal.isPending}
              className="w-full"
            >
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setIsCreating(false);
                setEditedGoal({});
              }}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
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

    const progress = Math.min(
      Math.round((goal.current_value / goal.target_value) * 100),
      100
    );

    return (
      <div className="space-y-3">
        <h3 className="font-semibold">{goal.name}</h3>
        <p className="text-sm text-gray-600">
          {new Date(goal.start_date).toLocaleDateString()} até{" "}
          {new Date(goal.end_date).toLocaleDateString()}
        </p>
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-600 text-right">{progress}% concluído</p>
        </div>
        <p className="text-sm">
          <span className="font-medium">
            R$ {goal.current_value.toLocaleString("pt-BR")}
          </span>{" "}
          / R$ {goal.target_value.toLocaleString("pt-BR")}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="text-muran-primary h-5 w-5" />
          Meta Atual
          {isAdmin && !isEditing && !isCreating && goal && (
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
      <CardContent className="p-4 pt-0">{renderContent()}</CardContent>
    </Card>
  );
};
