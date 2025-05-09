
import { Badge } from "@/components/ui/badge";
import { BadgeDollarSign } from "lucide-react";
import { formatDateInBrasiliaTz } from "@/components/daily-reviews/summary/utils";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { MetaAccount } from "@/components/daily-reviews/hooks/types/accountTypes";

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
  
  // Verificar se há um orçamento personalizado ativo
  const hasCustomBudget = !!customBudget || isUsingCustomBudgetInReview;
  
  // Obter datas do orçamento personalizado
  const customBudgetDates = customBudget ? {
    start: new Date(customBudget.start_date).toLocaleDateString('pt-BR'),
    end: new Date(customBudget.end_date).toLocaleDateString('pt-BR')
  } : (client.lastReview?.custom_budget_start_date && client.lastReview?.custom_budget_end_date) ? {
    start: new Date(client.lastReview.custom_budget_start_date).toLocaleDateString('pt-BR'),
    end: new Date(client.lastReview.custom_budget_end_date).toLocaleDateString('pt-BR')
  } : null;

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
        {hasCustomBudget && (
          <BadgeDollarSign size={16} className="text-[#ff6e00]" />
        )}
      </div>
      
      {lastReviewDate && (
        <div className="text-sm text-gray-500">
          Última revisão: {formatDateInBrasiliaTz(new Date(lastReviewDate), "dd/MM 'às' HH:mm")}
        </div>
      )}
      
      {hasCustomBudget && (
        <div className="mt-1">
          <Badge className="bg-[#ff6e00]/10 text-[#ff6e00] hover:bg-[#ff6e00]/20 border-none">
            Orçamento personalizado ativo
            {customBudgetDates && (
              <span className="ml-1 text-xs">
                ({customBudgetDates.start} - {customBudgetDates.end})
              </span>
            )}
          </Badge>
        </div>
      )}
    </>
  );
};
