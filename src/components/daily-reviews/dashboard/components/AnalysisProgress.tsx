
import { Progress } from "@/components/ui/progress";

interface AnalysisProgressProps {
  isBatchAnalyzing: boolean;
  batchProgress: number;
  totalClientsToAnalyze: number;
  progressPercentage: number;
}

export const AnalysisProgress = ({
  isBatchAnalyzing,
  batchProgress,
  totalClientsToAnalyze,
  progressPercentage
}: AnalysisProgressProps) => {
  if (!isBatchAnalyzing) return null;
  
  // Garantir que a porcentagem nunca exceda 100%
  const safePercentage = Math.min(progressPercentage, 100);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Progresso da análise</span>
        <span className="text-sm text-gray-500">
          {batchProgress} de {totalClientsToAnalyze} ({safePercentage}%)
        </span>
      </div>
      <Progress 
        value={safePercentage} 
        className="h-2" 
        indicatorClassName="bg-muran-primary"
      />
    </div>
  );
};
