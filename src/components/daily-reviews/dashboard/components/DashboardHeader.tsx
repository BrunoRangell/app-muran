
import { Button } from "@/components/ui/button";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { Loader, PlayCircle } from "lucide-react";

interface DashboardHeaderProps {
  lastBatchReviewTime: string | null;
  isBatchAnalyzing: boolean;
  isLoading: boolean;
  onAnalyzeAll: () => void;
}

export const DashboardHeader = ({
  lastBatchReviewTime,
  isBatchAnalyzing,
  isLoading,
  onAnalyzeAll
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
      <div>
        <h2 className="text-xl font-semibold text-muran-dark mb-1">
          Revisão de Orçamentos Meta Ads
        </h2>
        {lastBatchReviewTime && (
          <p className="text-sm text-gray-500">
            {formatDateInBrasiliaTz(lastBatchReviewTime, "'Última revisão em massa em' dd 'de' MMMM 'às' HH:mm", 'pt-BR')}
          </p>
        )}
      </div>
      
      <Button
        onClick={onAnalyzeAll}
        disabled={isBatchAnalyzing || isLoading}
        variant="default"
        className="bg-muran-primary hover:bg-muran-primary/90 text-white"
      >
        {isBatchAnalyzing ? (
          <>
            <Loader size={16} className="mr-2 animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <PlayCircle size={16} className="mr-2" />
            Analisar Todos
          </>
        )}
      </Button>
    </div>
  );
};
