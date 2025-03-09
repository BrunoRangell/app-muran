
import { formatDateInBrasiliaTz } from "../summary/utils";
import { getCurrentDateInBrasiliaTz } from "../summary/utils";

interface CardHeaderProps {
  companyName: string;
  remainingDays: number;
}

export const CardHeader = ({ companyName, remainingDays }: CardHeaderProps) => {
  // Usar a data atual para a última revisão
  const currentDate = getCurrentDateInBrasiliaTz();
  const formattedCurrentDate = formatDateInBrasiliaTz(
    currentDate, 
    "'Última revisão em' dd 'de' MMMM"
  );

  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-medium text-lg truncate text-gray-800">{companyName}</h3>
      <div className="text-xs text-gray-500 flex flex-col items-end">
        <span>{formattedCurrentDate}</span>
        <span>{remainingDays} dias restantes no mês</span>
      </div>
    </div>
  );
};
