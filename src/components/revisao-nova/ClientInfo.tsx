
import { Button } from "@/components/ui/button";
import { ExternalLink, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface ClientInfoProps {
  client: {
    company_name: string;
    meta_account_id: string | null;
    meta_ads_budget?: number;
  } | null;
}

export function ClientInfo({ client }: ClientInfoProps) {
  if (!client) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="font-semibold text-lg">{client.company_name}</div>
      
      <div className="flex flex-col space-y-2 mt-2">
        <div className="text-sm text-gray-600 flex items-center">
          ID Meta Ads: 
          <code className="mx-1 bg-gray-100 px-1 rounded">{client.meta_account_id || "Não configurado"}</code>
          {client.meta_account_id && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => window.open(`https://business.facebook.com/adsmanager/manage/campaigns?act=${client.meta_account_id}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver no Meta Ads
            </Button>
          )}
        </div>

        <div className="text-sm flex items-center font-medium">
          <DollarSign className="h-4 w-4 text-muran-primary mr-1" />
          Orçamento Mensal: 
          <span className="mx-1 px-2 py-0.5 bg-muran-primary/10 text-muran-primary rounded">
            {client.meta_ads_budget ? formatCurrency(client.meta_ads_budget) : "Não configurado"}
          </span>
        </div>
      </div>
    </div>
  );
}
