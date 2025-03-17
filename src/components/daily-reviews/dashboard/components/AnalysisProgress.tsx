
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
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Progresso da análise</span>
        <span className="text-sm text-gray-500">
          {batchProgress} de {totalClientsToAnalyze} ({progressPercentage}%)
        </span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="h-2" 
        indicatorClassName="bg-muran-primary"
      />
    </div>
  );
};
