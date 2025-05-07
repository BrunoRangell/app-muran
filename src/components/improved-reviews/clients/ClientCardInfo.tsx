
import { formatDateInBrasiliaTz } from "@/components/daily-reviews/summary/utils";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { BadgeDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientCardInfoProps {
  client: ClientWithReview;
  hasReview: boolean;
  accountName?: string;
  customBudget?: any;
  platform?: "meta" | "google";
}

export const ClientCardInfo = ({ 
  client, 
  hasReview, 
  accountName,
  customBudget,
  platform = "meta"
}: ClientCardInfoProps) => {
  const isUsingCustomBudgetInReview = Boolean(
    client.lastReview?.using_custom_budget && 
    client.lastReview?.custom_budget_id
  );
  
  const lastReviewDate = client.lastReview?.updated_at;

  return (
    <div className="mb-2">
      <div className="font-medium text-gray-900">
        {client.company_name}
      </div>
      
      {accountName && platform === "meta" && (
        <div className="text-sm text-gray-500">
          CA: {accountName}
        </div>
      )}
      
      {accountName && platform === "google" && (
        <div className="text-sm text-gray-500">
          {accountName}
        </div>
      )}
      
      {lastReviewDate && (
        <div className="text-xs text-gray-500 mt-1">
          Última revisão: {formatDateInBrasiliaTz(new Date(lastReviewDate), "dd/MM 'às' HH:mm")}
        </div>
      )}
      
      {customBudget && isUsingCustomBudgetInReview && (
        <div className="mt-1">
          <Badge className="bg-[#ff6e00]/10 text-[#ff6e00] hover:bg-[#ff6e00]/20 border-none flex items-center gap-1">
            <BadgeDollarSign size={14} />
            <span>Orçamento personalizado</span>
          </Badge>
        </div>
      )}
    </div>
  );
};
