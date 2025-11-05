
import { Progress } from "@/components/ui/progress";
import { Goal, GOAL_TYPES } from "@/types/goal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, TrendingUp } from "lucide-react";
import { getDaysRemaining } from "../goal/goalUtils";

interface GoalProgressProps {
  goal: Goal;
  currentValue: number;
  newClientsThisMonth?: number;
}

export const GoalProgress = ({ goal, currentValue, newClientsThisMonth = 0 }: GoalProgressProps) => {
  const progress = Math.min(Math.round((currentValue / goal.target_value) * 100), 100);

  const getProgressColor = (value: number) => {
    if (value >= 100) return "bg-gradient-to-r from-emerald-400 to-green-500";
    if (value >= 75) return "bg-gradient-to-r from-violet-500 to-purple-600";
    if (value >= 50) return "bg-gradient-to-r from-amber-400 to-orange-500";
    return "bg-gradient-to-r from-rose-400 to-pink-600";
  };

  const getMotivationalMessage = (value: number) => {
    if (value >= 100) return "🎉 Meta alcançada!";
    if (value >= 75) return "🔥 Quase lá!";
    if (value >= 50) return "💪 Na metade do caminho!";
    if (value >= 25) return "🚀 Bom começo!";
    return "⏳ Vamos começar!";
  };

  const getCurrentValueLabel = () => {
    switch (goal.goal_type) {
      case 'active_clients':
        return 'Clientes ativos atualmente';
      case 'new_clients':
        return 'Novos clientes no período';
      default:
        return 'Clientes';
    }
  };

  // Função auxiliar para criar uma data correta sem problemas de timezone
  const createLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Define meio-dia para evitar problemas de timezone
  };

  const getRemainingDaysText = (days: number) => {
    if (days <= 0) return "Encerrado";
    return days === 1 ? "1 dia restante" : `${days} dias restantes`;
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-900">
              {GOAL_TYPES[goal.goal_type]}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">
                {format(createLocalDate(goal.start_date), "dd 'de' MMM", { locale: ptBR })} -{" "}
                {format(createLocalDate(goal.end_date), "dd 'de' MMM", { locale: ptBR })}
              </span>
              <span className="text-green-600">
                •{" "}
                {getRemainingDaysText(getDaysRemaining(goal.end_date))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Progress
          value={progress}
          className="h-2.5 rounded-full bg-gray-100"
          indicatorClassName={`${getProgressColor(progress)} rounded-full shadow-sm`}
        />
        <div className="flex items-center gap-2 justify-center text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-gray-600">Progresso:</span>
          </div>
          <span className="font-semibold bg-indigo-50 px-2 py-0.5 rounded text-indigo-700">{progress}%</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 p-2 rounded">
        <p className="text-center text-sm text-gray-700">
          {getMotivationalMessage(progress)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <p className="text-[11px] text-gray-500 mb-0.5">Meta</p>
          <p className="text-xl font-semibold">{goal.target_value}</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <p className="text-[11px] text-gray-500 mb-0.5">{getCurrentValueLabel()}</p>
          <p className="text-xl font-semibold">{currentValue}</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <p className="text-[11px] text-gray-500 mb-0.5">Novos este mês</p>
          <p className="text-xl font-semibold">{newClientsThisMonth}</p>
        </div>
      </div>
    </div>
  );
};
