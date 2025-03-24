
import { formatDateInBrasiliaTz } from "../summary/utils";

interface CardHeaderProps {
  companyName: string;
  lastReviewDate?: Date | string | null;
  lastReviewUpdatedAt?: string | null;
  platform?: "meta" | "google";
}

export const CardHeader = ({ 
  companyName, 
  lastReviewDate,
  lastReviewUpdatedAt,
  platform = "meta"
}: CardHeaderProps) => {
  // Usar updated_at para o horário da revisão, se disponível
  const formattedLastReviewDate = lastReviewUpdatedAt 
    ? formatDateInBrasiliaTz(
        new Date(lastReviewUpdatedAt), 
        "'Última revisão em' dd/MM 'às' HH:mm"
      )
    : lastReviewDate 
      ? formatDateInBrasiliaTz(
          lastReviewDate instanceof Date ? lastReviewDate : new Date(lastReviewDate), 
          "'Última revisão em' dd/MM"
        ) 
      : "Sem revisão anterior";

  const platformLabel = platform === "meta" ? "Meta Ads" : "Google Ads";

  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-medium text-lg truncate text-gray-800">{companyName}</h3>
      <div className="text-xs text-gray-500 flex flex-col items-end">
        <span>{formattedLastReviewDate}</span>
        <span className="text-xs text-muran-primary font-medium">{platformLabel}</span>
      </div>
    </div>
  );
};
