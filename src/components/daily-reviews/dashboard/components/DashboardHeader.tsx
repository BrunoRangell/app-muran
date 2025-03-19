
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw } from "lucide-react";
import { formatDateInBrasiliaTz } from "../../summary/utils";

interface DashboardHeaderProps {
  lastBatchReviewTime: Date | null;
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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-muran-dark mb-1">
          Dashboard Meta Ads
        </h2>
        {lastBatchReviewTime && (
          <p className="text-sm text-gray-500">
            {formatDateInBrasiliaTz(lastBatchReviewTime, "'Última revisão em massa em' dd/MM 'às' HH:mm")}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="default"
          onClick={onAnalyzeAll}
          disabled={isBatchAnalyzing || isLoading}
          className="bg-muran-primary hover:bg-muran-primary/90"
        >
          {isBatchAnalyzing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            'Analisar Todos'
          )}
        </Button>
      </div>
    </div>
  );
};
