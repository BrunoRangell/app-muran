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
        <div className="flex items-center gap-4