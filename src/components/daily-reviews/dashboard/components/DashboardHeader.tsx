
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader } from "lucide-react";
import { formatDateInBrasiliaTz } from "../../summary/utils";

interface DashboardHeaderProps {
  lastReviewTime: Date | null;
  isBatchAnalyzing: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onAnalyzeAll: () => void;
}

export const DashboardHeader = ({
  lastReviewTime,
  isBatchAnalyzing,
  isLoading,
  onRefresh,
  onAnalyzeAll
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-muran-dark mb-1">
          Dashboard Meta Ads
        </h2>
        {lastReviewTime && (
          <p className="text-sm text-gray-500">
            {formatDateInBrasiliaTz(lastReviewTime, "'Última revisão em massa em' dd/MM 'às' HH:mm")}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isBatchAnalyzing || isLoading}
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
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
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Analisar Todos
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
