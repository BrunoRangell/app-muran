
import { Badge } from "@/components/ui/badge";
import { BadgeDollarSign, Calendar } from "lucide-react";
import { formatDateInBrasiliaTz } from "@/components/daily-reviews/summary/utils";
import { ClientWithReview, MetaAccount } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  
  const formatCustomDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <BadgeDollarSign size={16} className="text-[#ff6e00]" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p>Orçamento personalizado: R$ {customBudget.budget_amount}</p>
                  <p>Período: {formatCustomDate(customBudget.start_date)} até {formatCustomDate(customBudget.end_date)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {lastReviewDate && (
        <div className="text-sm text-gray-500">
          Última revisão: {formatDateInBrasiliaTz(new Date(lastReviewDate), "dd/MM 'às' HH:mm")}
        </div>
      )}
      
      {customBudget && isUsingCustomBudgetInReview && (
        <div className="mt-1 flex items-center gap-1">
          <Badge className="bg-[#ff6e00]/10 text-[#ff6e00] hover:bg-[#ff6e00]/20 border-none">
            Orçamento personalizado ativo
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Calendar size={14} className="text-[#ff6e00]/70" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Válido até {formatCustomDate(customBudget.end_date)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );
};
