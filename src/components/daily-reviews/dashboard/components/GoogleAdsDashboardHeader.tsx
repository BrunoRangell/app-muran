
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw, Calendar } from "lucide-react";
import { formatDateInBrasiliaTz, getRemainingDaysInMonth } from "../../summary/utils";

interface GoogleAdsDashboardHeaderProps {
  lastBatchReviewTime: Date | null;
  isBatchAnalyzing: boolean;
  isLoading: boolean;
  onAnalyzeAll: () => void;
}

export function GoogleAdsDashboardHeader({
  lastBatchReviewTime,
  isBatchAnalyzing,
  isLoading,
  onAnalyzeAll
}: GoogleAdsDashboardHeaderProps) {
  // Obter dias restantes no mês
  const remainingDays = getRemainingDaysInMonth();
  
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-muran-dark mb-1">
            Dashboard Google Ads
          </h2>
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
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Analisar Todos
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Bloco de informações sobre última revisão e dias restantes */}
      <div className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muran-primary" />
          <div>
            <span className="text-sm font-medium text-gray-700">Última revisão em massa:</span>
            {lastBatchReviewTime ? (
              <p className="text-sm text-muran-dark font-semibold">
                {formatDateInBrasiliaTz(lastBatchReviewTime, "dd 'de' MMMM 'às' HH:mm")}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhuma revisão em massa realizada</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muran-primary" />
          <div>
            <span className="text-sm font-medium text-gray-700">Dias restantes no mês:</span>
            <p className="text-sm text-muran-dark font-semibold">
              {remainingDays} {remainingDays === 1 ? 'dia' : 'dias'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
