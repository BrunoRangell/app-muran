
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { CampaignDetail } from "./types/enhanced-types";

interface CampaignDetailsTooltipProps {
  campaigns: CampaignDetail[];
  children: React.ReactNode;
  title: string;
  platform: string;
}

export function CampaignDetailsTooltip({ 
  campaigns, 
  children, 
  title, 
  platform 
}: CampaignDetailsTooltipProps) {
  if (!campaigns || campaigns.length === 0) {
    return <>{children}</>;
  }

  // Separar campanhas com e sem veiculação
  const campaignsWithServing = campaigns.filter(c => c.impressions > 0 || c.cost > 0);
  const campaignsWithoutServing = campaigns.filter(c => c.impressions === 0 && c.cost === 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:opacity-80 transition-opacity">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-800">
              {title} - {platform}
            </CardTitle>
            <div className="text-xs text-gray-500">
              {campaigns.length} campanha{campaigns.length > 1 ? 's' : ''} ativa{campaigns.length > 1 ? 's' : ''}
            </div>
          </CardHeader>
          <CardContent className="pt-0 max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {/* Campanhas com problemas primeiro */}
              {campaignsWithoutServing.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      Sem Veiculação ({campaignsWithoutServing.length})
                    </span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {campaignsWithoutServing.map((campaign) => (
                      <div key={campaign.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate max-w-48">
                            {campaign.name}
                          </span>
                          <Badge variant="destructive" className="text-xs ml-2">
                            Problema
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>Custo: R$ {campaign.cost.toFixed(2)}</div>
                          <div>Impressões: {campaign.impressions.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campanhas funcionando normalmente */}
              {campaignsWithServing.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Veiculando ({campaignsWithServing.length})
                    </span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {campaignsWithServing.map((campaign) => (
                      <div key={campaign.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate max-w-48">
                            {campaign.name}
                          </span>
                          <Badge variant="secondary" className="text-xs ml-2 bg-green-100 text-green-700">
                            OK
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>Custo: R$ {campaign.cost.toFixed(2)}</div>
                          <div>Impressões: {campaign.impressions.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo no final */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center">
                  <div className="font-medium text-gray-800">
                    R$ {campaigns.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}
                  </div>
                  <div className="text-gray-500">Custo Total</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-800">
                    {campaigns.reduce((sum, c) => sum + c.impressions, 0).toLocaleString()}
                  </div>
                  <div className="text-gray-500">Impressões Totais</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
