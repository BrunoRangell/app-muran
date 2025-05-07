
import { Progress } from "@/components/ui/progress";

interface MetaAnalysisProgressProps {
  batchProgress: number;
  totalClientsToAnalyze: number;
}

export const MetaAnalysisProgress = ({
  batchProgress,
  totalClientsToAnalyze
}: MetaAnalysisProgressProps) => {
  const progressPercentage = totalClientsToAnalyze > 0 
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progresso da análise em lote</span>
        <span className="font-medium">{batchProgress} / {totalClientsToAnalyze} ({progressPercentage}%)</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};
