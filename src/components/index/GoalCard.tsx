import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Gauge, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/types/supabase";

interface Goal {
  id: number;
  goal_type: 'active_clients' | 'new_clients' | 'churned_clients';
  start_date: string;
  end_date: string;
  target_value: number;
  current_value: number;
  manager_id: string;
}

const GOAL_TYPES = {
  active_clients: 'Meta de Clientes Ativos',
  new_clients: 'Meta de Novos Clientes',
  churned_clients: 'Meta de Clientes Cancelados'
} as const;

export const GoalCard = ({ isAdmin }: { isAdmin: boolean }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  const calculateCurrentValue = async (goal: Goal) => {
    const { start_date, end_date, goal_type } = goal;
    let query = supabase.from('clients').select('*', { count: 'exact' });

    switch (goal_type) {
      case 'active_clients':
        query = query.eq('status', 'active');
        break;
      case 'new_clients':
        query = query
          .eq('status', 'active')
          .gte('first_payment_date', start_date)
          .lte('first_payment_date', end_date);
        break;
      case 'churned_clients':
        query = query
          .eq('status', 'inactive')
          .gte('last_payment_date', start_date)
          .lte('last_payment_date', end_date);
        break;
    }

    const { count, error } = await query;
    
    if (error) {
      console.error("Erro ao calcular valor atual:", error);
      return 0;
    }

    return count || 0;
  };

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

  const goal = goals?.[0];

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
          <Select
            value={editedGoal.goal_type}
            onValueChange={(value) => 
              setEditedGoal({ 
                ...editedGoal, 
                goal_type: value as Goal['goal_type']
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de meta" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GOAL_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                target_value: parseInt(e.target.value),
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
        <h3 className="font-semibold">{GOAL_TYPES[goal.goal_type]}</h3>
        <p className="text-sm text-gray-600">
          {format(new Date(goal.start_date), 'dd/MM')} até{" "}
          {format(new Date(goal.end_date), 'dd/MM')}
        </p>
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-600 text-right">{progress}% concluído</p>
        </div>
        <p className="text-sm">
          <span className="font-medium">
            {goal.current_value}
          </span>{" "}
          / {goal.target_value}
        </p>
      </div>
    );
  };

  const formattedDateRange = goal 
    ? `${format(new Date(goal.start_date), 'dd/MM')} até ${format(new Date(goal.end_date), 'dd/MM')}`
    : '';

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