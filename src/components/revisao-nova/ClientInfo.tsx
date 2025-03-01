
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ClientInfoProps {
  client: {
    company_name: string;
    meta_account_id: string | null;
  } | null;
}

export function ClientInfo({ client }: ClientInfoProps) {
  if (!client) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="font-semibold text-lg">{client.company_name}</div>
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
    </div>
  );
}
