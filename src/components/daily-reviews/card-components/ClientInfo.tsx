
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { MetaAccount } from "../hooks/types/accountTypes";

interface ClientInfoProps {
  client: ClientWithReview;
  metaAccount?: MetaAccount;
  customBudget?: any;
  isUsingCustomBudgetInReview?: boolean;
}

export const ClientInfo = ({ 
  client, 
  metaAccount,
  customBudget,
  isUsingCustomBudgetInReview 
}: ClientInfoProps) => {
  return (
    <div>
      <div className="font-medium">{client.company_name}</div>
      
      {metaAccount && (
        <div className="text-xs text-gray-500 mt-0.5">
          Conta: {metaAccount.account_name} 
          {metaAccount.is_primary && <span className="ml-1 text-green-600">(Principal)</span>}
        </div>
      )}
      
      {customBudget && isUsingCustomBudgetInReview && (
        <div className="text-xs text-blue-600 mt-0.5">
          Orçamento personalizado ativo
        </div>
      )}
    </div>
  );
};
