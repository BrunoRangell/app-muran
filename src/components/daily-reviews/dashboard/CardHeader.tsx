
import { formatDateInBrasiliaTz } from "../summary/utils";

interface CardHeaderProps {
  companyName: string;
  lastReviewDate?: Date | string | null;
}

export const CardHeader = ({ 
  companyName, 
  lastReviewDate
}: CardHeaderProps) => {
  // Formatar a data da última revisão, se disponível
  const formattedLastReviewDate = lastReviewDate 
    ? formatDateInBrasiliaTz(
        lastReviewDate, 
        "'Última revisão em' dd 'de' MMMM 'às' HH:mm"
      )
    : "Sem revisão anterior";

  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-medium text-lg truncate text-gray-800">{companyName}</h3>
      <div className="text-xs text-gray-500 flex flex-col items-end">
        <span>{formattedLastReviewDate}</span>
      </div>
    </div>
  );
};
