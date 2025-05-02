
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
  
  // Log para depuração - exibe informações detalhadas da conta
  console.log(`Renderizando card para ${client.company_name} - Conta: ${accountName}, ID: ${accountId || 'N/A'}`);
  
  // Buscamos revisão específica para esta conta se existir
  let specificReview = null;
  if (client.lastReview) {
    // Verificamos se a revisão corresponde à conta atual
    if (accountId && 
        (client.lastReview.meta_account_id === accountId || 
         client.lastReview.client_account_id === accountId)) {
      specificReview = client.lastReview;
      console.log(`Encontrada revisão específica para conta ${accountId}:`, specificReview);
    } else if (!accountId) {
      // Se não temos accountId, consideramos que esta é a revisão para a conta principal
      specificReview = client.lastReview;
    }
  } else {
    console.log(`Sem revisão para conta ${accountId || 'principal'} do cliente ${client.company_name}. A análise deve ser feita.`);
  }
  
  const handleReviewClick = () => {
    onReviewClient(client.id, accountId);
    console.log(`Analisando cliente ${client.id} com conta ${accountId || 'principal'}`);
  };
  
  // Definir se a conta precisa de revisão - agora garantimos que mostramos o card mesmo sem revisão
  const needsReview = !specificReview;
  
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
          {specificReview?.meta_total_spent 
            ? formatCurrency(specificReview?.meta_total_spent)
            : "-"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-gray-900">
          {specificReview?.meta_daily_budget_current 
            ? formatCurrency(specificReview?.meta_daily_budget_current)
            : "-"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-gray-900">-</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-2">
          <Link to={`/revisao-meta/${client.id}${accountId ? `?accountId=${accountId}` : ''}`}>
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
            className={needsReview ? "bg-[#ff6e00] text-white hover:bg-[#e66300]" : (accountId ? "bg-[#ff6e00] text-white hover:bg-[#e66300]" : "")}
          >
            {isProcessing ? "Analisando..." : (specificReview ? "Atualizar" : "Analisar")}
          </Button>
        </div>
      </td>
    </tr>
  );
};
