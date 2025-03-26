
import { Button } from "@/components/ui/button";
import { GoogleAdsTokensSetupForm } from "../../GoogleAdsTokensSetupForm";
import { Loader, RefreshCw } from "lucide-react";

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
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Revisão de Orçamentos Google Ads
        </h2>
        {lastBatchReviewTime && (
          <p className="text-sm text-gray-500">
            Última análise em lote:{" "}
            {lastBatchReviewTime.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <GoogleAdsTokensSetupForm />
        
        <Button 
          onClick={onAnalyzeAll} 
          disabled={isLoading || isBatchAnalyzing}
          variant="default"
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
}
