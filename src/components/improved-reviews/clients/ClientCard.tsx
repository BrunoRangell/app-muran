
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientCardInfo } from "./ClientCardInfo";
import { Button } from "@/components/ui/button";
import { BarChart, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ClientCardProps {
  client: any;
  platform?: "meta" | "google";
}

export function ClientCard({ client, platform = "meta" }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extrair nome da conta da plataforma correta
  const accountName = client[`${platform}_account_name`];

  return (
    <Card className={`overflow-hidden ${client.needsAdjustment ? 'border-2 border-amber-300' : ''}`}>
      <CardHeader className="bg-gray-50 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-base line-clamp-1" title={client.company_name}>
              {client.company_name}
            </h3>
            {platform === "meta" ? (
              <p className="text-sm text-gray-500 line-clamp-1" title={client.meta_account_name || "Sem conta"}>
                {client.meta_account_name || "Sem conta Meta Ads"}
              </p>
            ) : (
              <p className="text-sm text-gray-500 line-clamp-1" title={client.google_account_name || "Sem conta"}>
                {client.google_account_name || "Sem conta Google Ads"}
              </p>
            )}
          </div>
          {client.needsAdjustment && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
              Ajuste Necessário
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <ClientCardInfo 
          platform={platform}
          dailyBudget={client.dailyBudget || 0}
          idealBudget={client.idealBudget || 0}
          totalSpent={client.totalSpent || 0}
          needsAdjustment={client.needsAdjustment}
          totalBudget={client.totalBudget || 0}
          lastFiveDaysAvg={client.lastFiveDaysAvg}
          accountName={accountName}
        />
      </CardContent>
      
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          <BarChart className="h-3.5 w-3.5 mr-1.5" />
          {isExpanded ? "Menos detalhes" : "Mais detalhes"}
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          className="text-xs bg-muran-primary hover:bg-muran-primary/90"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Ver detalhes
        </Button>
      </CardFooter>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Status:</strong> {client.status || "Desconhecido"}</p>
            <p><strong>ID da conta:</strong> {client[`${platform}_account_id`] || "N/A"}</p>
            <p><strong>Última revisão:</strong> {client.lastReviewDate || "N/A"}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
