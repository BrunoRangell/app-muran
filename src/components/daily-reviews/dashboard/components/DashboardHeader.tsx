import { Button } from "@/components/ui/button";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";
import { getDaysInMonth } from "date-fns";
import { Loader, PlayCircle, Calendar } from "lucide-react";

// Função para obter dias restantes no mês
const getRemainingDaysInMonth = () => {
  const now = new Date();
  const daysInMonth = getDaysInMonth(now);
  const currentDay = now.getDate();
  return daysInMonth - currentDay + 1;
};

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
  // Obter dias restantes no mês - mesmo cálculo usado nos cards
  const remainingDays = getRemainingDaysInMonth();
  
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-muran-dark mb-1">
            Revisão de Orçamentos Meta Ads
          </h2>
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
      
      {/* Bloco de informações sobre última revisão e dias restantes */}
      <div className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muran-primary" />
          <div>
            <span className="text-sm font-medium text-gray-700">Última revisão em massa:</span>
            {lastBatchReviewTime ? (
              <p className="text-sm text-muran-dark font-semibold">
                {formatDateInBrasiliaTz(lastBatchReviewTime, "dd 'de' MMMM 'às' HH:mm", 'pt-BR')}
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
};
