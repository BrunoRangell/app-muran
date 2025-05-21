
import { formatDateInBrasiliaTz } from "../summary/utils";
import { BadgeDollarSign } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CardHeaderProps {
  companyName: string;
  lastReviewDate?: Date | string | null;
  lastReviewUpdatedAt?: string | null;
  hasCustomBudget?: boolean;
}

export const CardHeader = ({ 
  companyName, 
  lastReviewDate,
  lastReviewUpdatedAt,
  hasCustomBudget
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

  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-medium text-lg truncate text-gray-800 flex items-center gap-1">
        {companyName}
        {hasCustomBudget && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <BadgeDollarSign size={16} className="text-[#ff6e00]" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Orçamento personalizado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </h3>
      <div className="text-xs text-gray-500 flex flex-col items-end">
        <span>{formattedLastReviewDate}</span>
      </div>
    </div>
  );
};
