
import { Badge } from "@/components/ui/badge";
import { BadgeDollarSign } from "lucide-react";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview } from "../../hooks/types/reviewTypes";

interface ClientInfoProps {
  client: ClientWithReview;
  customBudget: any | null;
  isUsingCustomBudgetInReview: boolean;
  accountName?: string;
}

export const ClientInfo = ({ 
  client, 
  customBudget, 
  isUsingCustomBudgetInReview,
  accountName
}: ClientInfoProps) => {
  const lastReviewDate = client.lastReview?.updated_at;

  return (
    <>
      <div className="font-medium text-gray-900 flex items-center gap-1">
        {client.company_name}
        {customBudget && isUsingCustomBudgetInReview && (
          <BadgeDollarSign size={16} className="text-[#ff6e00]" />
        )}
      </div>
      
      {accountName && (
        <div className="text-sm text-gray-500">
          Conta: {accountName}
        </div>
      )}
      
      {lastReviewDate && (
        <div className="text-sm text-gray-500">
          Última revisão: {formatDateInBrasiliaTz(new Date(lastReviewDate), "dd/MM 'às' HH:mm")}
        </div>
      )}
      
      {customBudget && isUsingCustomBudgetInReview && (
        <div className="mt-1">
          <Badge className="bg-[#ff6e00]/10 text-[#ff6e00] hover:bg-[#ff6e00]/20 border-none">
            Orçamento personalizado ativo
          </Badge>
        </div>
      )}
    </>
  );
};
