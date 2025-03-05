
import { BarChart3 } from "lucide-react";
import { SummaryCards } from "./summary/SummaryCards";
import { ClientsTable } from "./summary/ClientsTable";
import { LoadingState } from "./summary/LoadingState";
import { EmptyState } from "./summary/EmptyState";
import { useDailyReviewsSummary } from "./summary/useDailyReviewsSummary";
import { formatDateInBrasiliaTz } from "./summary/utils";
import { ptBR } from "date-fns/locale";

export const DailyReviewsSummary = () => {
  const { 
    data, 
    isLoading, 
    increases, 
    decreases, 
    maintains, 
    totalMonthlyBudget, 
    totalSpent 
  } = useDailyReviewsSummary();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Formatar a data atual com o fuso horário de Brasília
  const currentDateFormatted = formatDateInBrasiliaTz(
    new Date(),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="text-muran-primary" size={20} />
        Resumo de revisões de hoje - {currentDateFormatted}
      </h2>
      
      <SummaryCards
        totalMonthlyBudget={totalMonthlyBudget}
        totalSpent={totalSpent}
        increases={increases}
        decreases={decreases}
        maintains={maintains}
        reviewsCount={data.length}
      />

      <ClientsTable data={data} />
    </div>
  );
};
