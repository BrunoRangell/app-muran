import { Progress } from "@/components/ui/progress";
import { Goal, GOAL_TYPES } from "@/types/goal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Target, TrendingUp } from "lucide-react";

interface GoalProgressProps {
  goal: Goal;
  currentValue: number;
}

export const GoalProgress = ({ goal, currentValue }: GoalProgressProps) => {
  const progress = Math.min(
    Math.round((currentValue / goal.target_value) * 100),
    100
  );

  const getProgressColor = (value: number) => {
    if (value >= 100) return "bg-green-500";
    if (value >= 75) return "bg-blue-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-muran-primary";
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-muran-primary" />
        <h3 className="font-bold text-2xl">{GOAL_TYPES[goal.goal_type]}</h3>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="h-5 w-5" />
        <span>
          {format(new Date(goal.start_date), "dd 'de' MMMM", { locale: ptBR })} até{" "}
          {format(new Date(goal.end_date), "dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>

      <div className="space-y-2">
        <Progress 
          value={progress} 
          className="h-4 rounded-full"
          indicatorClassName={getProgressColor(progress)}
        />
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-5 w-5 text-muran-primary" />
            <span>Progresso:</span>
          </div>
          <span className="font-semibold">{progress}%</span>
        </div>
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div className="text-sm">
          <p className="text-gray-600">Atual</p>
          <p className="font-bold text-lg">{currentValue}</p>
        </div>
        <div className="text-sm text-right">
          <p className="text-gray-600">Meta</p>
          <p className="font-bold text-lg">{goal.target_value}</p>
        </div>
      </div>

      {progress === 100 && (
        <div className="p-3 bg-green-100 text-green-700 rounded text-center font-semibold">
          Parabéns! Meta alcançada!
        </div>
      )}
    </div>
  );
};
