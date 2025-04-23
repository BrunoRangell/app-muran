
import { Badge } from "@/components/ui/badge";
import { BadgeDollarSign } from "lucide-react";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview } from "../../hooks/types/reviewTypes";
import { MetaAccount } from "../../hooks/types/accountTypes";

interface ClientInfoProps {
  client: ClientWithReview;
  metaAccount?: MetaAccount;
  customBudget: any | null;
  isUsingCustomBudgetInReview: boolean;
}

export const ClientInfo = ({ 
  client, 
  metaAccount,
  customBudget, 
  isUsingCustomBudgetInReview 
}: ClientInfoProps) => {
  const lastReviewDate = client.lastReview?.updated_at;
  const isPrimaryAccount = metaAccount?.is_primary;

  return (
    <>
      <div className="font-medium text-gray-900 flex items-center gap-1">
        {client.company_name}
        {metaAccount?.account_name && (
          <span className="text-sm text-gray-500 ml-1">
            ({metaAccount.account_name})
            {isPrimaryAccount && (
              <span className="text-xs text-[#ff6e00] ml-1">(Principal)</span>
            )}
          </span>
        )}
        {customBudget && isUsingCustomBudgetInReview && (
          <BadgeDollarSign size={16} className="text-[#ff6e00]" />
        )}
      </div>
      
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
