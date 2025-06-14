
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings, TrendingUp, Eye } from "lucide-react";
import { StatusIndicator } from "./StatusIndicator";
import { ClientHealthData, PlatformHealthData } from "./types";

interface ClientHealthCardProps {
  client: ClientHealthData;
  onAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
}

function PlatformSection({ 
  platformData, 
  platformName, 
  clientId, 
  onAction,
  icon 
}: { 
  platformData?: PlatformHealthData;
  platformName: 'meta' | 'google';
  clientId: string;
  onAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
  icon: string;
}) {
  if (!platformData) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-lg">{icon}</div>
            <span className="font-medium text-gray-900 capitalize">{platformName} Ads</span>
          </div>
          <Badge variant="outline" className="text-gray-500">
            Não configurado
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="text-sm text-gray-500 text-center py-2">
            Conta não configurada
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('configure', clientId, platformName)}
            className="w-full text-xs h-8"
          >
            <Settings className="w-3 h-3 mr-2" />
            Configurar Conta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-lg">{icon}</div>
          <span className="font-medium text-gray-900 capitalize">{platformName} Ads</span>
        </div>
        <StatusIndicator status={platformData.status} showLabel={false} />
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-green-600 font-medium">
              R$ {platformData.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-green-700 text-xs">Gasto hoje</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-blue-600 font-medium">
              {platformData.impressionsToday.toLocaleString('pt-BR')}
            </div>
            <div className="text-blue-700 text-xs">Impressões</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {platformData.activeCampaignsCount} campanhas ativas
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('details', clientId, platformName)}
            className="flex-1 text-xs h-8"
          >
            <Eye className="w-3 h-3 mr-1" />
            Detalhes
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onAction('review', clientId, platformName)}
            className="flex-1 text-xs h-8 bg-[#ff6e00] hover:bg-[#e55a00]"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Revisar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ClientHealthCard({ client, onAction }: ClientHealthCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-[#ff6e00]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {client.clientName}
            </h3>
            {(client.metaAds?.accountId || client.googleAds?.accountId) && (
              <div className="flex flex-wrap gap-2">
                {client.metaAds?.accountId && (
                  <Badge variant="outline" className="text-xs">
                    Meta: {client.metaAds.accountId}
                  </Badge>
                )}
                {client.googleAds?.accountId && (
                  <Badge variant="outline" className="text-xs">
                    Google: {client.googleAds.accountId}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="ml-4">
            <StatusIndicator status={client.overallStatus} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlatformSection
            platformData={client.metaAds}
            platformName="meta"
            clientId={client.clientId}
            onAction={onAction}
            icon="📘"
          />
          
          <PlatformSection
            platformData={client.googleAds}
            platformName="google"
            clientId={client.clientId}
            onAction={onAction}
            icon="🔍"
          />
        </div>
      </CardContent>
    </Card>
  );
}
