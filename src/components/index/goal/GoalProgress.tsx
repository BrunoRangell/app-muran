
import { Progress } from "@/components/ui/progress";
import { Goal, GOAL_TYPES } from "@/types/goal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, TrendingUp } from "lucide-react";
import { getDaysRemaining } from "../goal/goalUtils";

interface GoalProgressProps {
  goal: Goal;
  currentValue: number;
}

export const GoalProgress = ({ goal, currentValue }: GoalProgressProps) => {
  const progress = Math.min(Math.round((currentValue / goal.target_value) * 100), 100);

  const getProgressColor = (value: number) => {
    if (value >= 100) return "bg-gradient-to-r from-green-400 to-emerald-500";
    if (value >= 75) return "bg-gradient-to-r from-blue-400 to-indigo-500";
    if (value >= 50) return "bg-gradient-to-r from-yellow-400 to-amber-500";
    return "bg-gradient-to-r from-pink-500 to-rose-500";
  };

  const getMotivationalMessage = (value: number) => {
    if (value >= 100) return "🎉 Meta alcançada!";
    if (value >= 75) return "🔥 Quase lá!";
    if (value >= 50) return "💪 Na metade do caminho!";
    if (value >= 25) return "🚀 Bom começo!";
    return "⏳ Vamos começar!";
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {GOAL_TYPES[goal.goal_type]}
            </h2>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-600">
                {format(new Date(goal.start_date), "dd 'de' MMM", { locale: ptBR })} -{" "}
                {format(new Date(goal.end_date), "dd 'de' MMM", { locale: ptBR })}
              </p>
              <p className="text-xs text-green-600">
                {getDaysRemaining(goal.end_date) > 0 
                  ? `${getDaysRemaining(goal.end_date)} dias restantes` 
                  : "Encerrado"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Progress
          value={progress}
          className="h-2 rounded-full"
          indicatorClassName={`${getProgressColor(progress)} rounded-full`}
        />
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-gray-600">Progresso:</span>
          </div>
          <span className="font-medium">{progress}%</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-2 rounded">
        <p className="text-center text-sm text-gray-700">
          {getMotivationalMessage(progress)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Meta</p>
          <p className="text-lg font-semibold">{goal.target_value}</p>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Atual</p>
          <p className="text-lg font-semibold">{currentValue}</p>
        </div>
      </div>
    </div>
  );
};
