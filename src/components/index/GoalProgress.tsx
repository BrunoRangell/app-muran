import { Progress } from "@/components/ui/progress";
import { Goal, GOAL_TYPES } from "@/types/goal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Target, TrendingUp, Zap } from "lucide-react";

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
    if (value >= 100) return "bg-gradient-to-r from-green-400 to-emerald-500";
    if (value >= 75) return "bg-gradient-to-r from-blue-400 to-indigo-500";
    if (value >= 50) return "bg-gradient-to-r from-yellow-400 to-amber-500";
    return "bg-gradient-to-r from-pink-500 to-rose-500";
  };

  const getMotivationalMessage = (value: number) => {
    if (value >= 100) return "🎉 Missão cumprida! Vocês são incríveis!";
    if (value >= 75) return "🔥 Quase lá! Últimos metros para a vitória!";
    if (value >= 50) return "💪 Metade do caminho! Vamos manter o ritmo!";
    if (value >= 25) return "🚀 Bom começo! Ainda temos muito pela frente!";
    return "⏳ Vamos começar? O desafio está apenas começando!";
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <Zap className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {GOAL_TYPES[goal.goal_type]}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {format(new Date(goal.start_date), "dd 'de' MMMM", { locale: ptBR })} -{" "}
              {format(new Date(goal.end_date), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="space-y-6">
        <div className="space-y-4">
          <Progress 
            value={progress} 
            className="h-3 rounded-full"
            indicatorClassName={`${getProgressColor(progress)} rounded-full`}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-gray-700">Progresso:</span>
            </div>
            <span className="font-bold text-gray-900">{progress}%</span>
          </div>
        </div>

        {/* Mensagem Motivacional */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
          <p className="text-center text-gray-700 font-medium">
            {getMotivationalMessage(progress)}
          </p>
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Atual</p>
          <p className="text-2xl font-bold text-gray-900">{currentValue}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Meta</p>
          <p className="text-2xl font-bold text-gray-900">{goal.target_value}</p>
        </div>
      </div>
    </div>
  );
};