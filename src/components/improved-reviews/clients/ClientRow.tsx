
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ClientCardInfo } from "./ClientCardInfo";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ClientRowProps {
  client: any;
  platform?: "meta" | "google";
}

export function ClientRow({ client, platform = "meta" }: ClientRowProps) {
  // Extrair nome da conta da plataforma correta
  const accountName = client[`${platform}_account_name`];

  return (
    <Card className={`p-4 ${client.needsAdjustment ? 'border-2 border-amber-300' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-3">
          <div className="flex flex-col">
            <h3 className="font-medium">{client.company_name}</h3>
            {platform === "meta" ? (
              <p className="text-sm text-gray-500">{client.meta_account_name || "Sem conta Meta Ads"}</p>
            ) : (
              <p className="text-sm text-gray-500">{client.google_account_name || "Sem conta Google Ads"}</p>
            )}
          </div>
        </div>
        
        <div className="md:col-span-7">
          <ClientCardInfo 
            platform={platform}
            dailyBudget={client.dailyBudget || 0}
            idealBudget={client.idealBudget || 0}
            totalSpent={client.totalSpent || 0}
            needsAdjustment={client.needsAdjustment}
            totalBudget={client.totalBudget || 0}
            lastFiveDaysAvg={client.lastFiveDaysAvg}
            className="h-full"
            accountName={accountName}
          />
        </div>
        
        <div className="md:col-span-2 flex justify-end items-center gap-3">
          {client.needsAdjustment && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 whitespace-nowrap">
              Ajuste Necessário
            </Badge>
          )}
          
          <Button 
            variant="default" 
            size="sm" 
            className="bg-muran-primary hover:bg-muran-primary/90 whitespace-nowrap"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Ver detalhes
          </Button>
        </div>
      </div>
    </Card>
  );
}
