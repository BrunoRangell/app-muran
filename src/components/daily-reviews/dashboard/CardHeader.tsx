
import { formatDateInBrasiliaTz } from "../summary/utils";
import { getCurrentDateInBrasiliaTz } from "../summary/utils";

interface CardHeaderProps {
  companyName: string;
  remainingDays: number;
  lastReviewDate?: Date | string | null;
}

export const CardHeader = ({ 
  companyName, 
  remainingDays,
  lastReviewDate
}: CardHeaderProps) => {
  // Usar a data atual
  const currentDate = getCurrentDateInBrasiliaTz();
  const formattedCurrentDate = formatDateInBrasiliaTz(
    currentDate, 
    "'Data atual:' dd 'de' MMMM"
  );

  // Formatar a data da última revisão, se disponível
  const formattedLastReviewDate = lastReviewDate 
    ? formatDateInBrasiliaTz(
        lastReviewDate, 
        "'Última revisão em' dd 'de' MMMM"
      )
    : "Sem revisão anterior";

  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-medium text-lg truncate text-gray-800">{companyName}</h3>
      <div className="text-xs text-gray-500 flex flex-col items-end">
        <span>{formattedCurrentDate}</span>
        <span>{remainingDays} dias restantes no mês</span>
        <span>{formattedLastReviewDate}</span>
      </div>
    </div>
  );
};
