
import { ClientWithReview, MetaAccount } from "../hooks/types/reviewTypes";
import { formatCurrency } from "@/utils/formatters";
import { CardActions } from "./CardActions";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

interface ClientAltCardProps {
  client: ClientWithReview;
  metaAccount?: MetaAccount;
  onReviewClient: (clientId: string, accountId?: string) => void;
  isProcessing: boolean;
}

export const ClientAltCard = ({
  client,
  metaAccount,
  onReviewClient,
  isProcessing
}: ClientAltCardProps) => {
  // Se temos uma conta Meta específica
  const accountId = metaAccount?.account_id;
  const accountName = metaAccount?.account_name || "Conta Principal";
  const budgetAmount = metaAccount?.budget_amount || client.meta_ads_budget || 0;
  
  const handleReviewClick = () => {
    onReviewClient(client.id, accountId);
  };
  
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{client.company_name}</span>
          {accountId ? (
            <span className="text-xs text-gray-500">
              {accountName} ({accountId.substring(0, 10)}...)
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-gray-900">{formatCurrency(budgetAmount)}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-gray-900">
          {client.lastReview?.meta_total_spent 
            ? formatCurrency(client.lastReview?.meta_total_spent)
            : "-"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-gray-900">
          {client.lastReview?.meta_daily_budget_current 
            ? formatCurrency(client.lastReview?.meta_daily_budget_current)
            : "-"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-gray-900">-</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-2">
          <Link to={`/revisao-meta/${client.id}`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-300 text-gray-700"
            >
              <ExternalLink size={14} className="mr-1" />
              Detalhes
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReviewClick}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? "Analisando..." : "Analisar"}
          </Button>
        </div>
      </td>
    </tr>
  );
};
