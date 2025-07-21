import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, Settings, ExternalLink, AlertTriangle, Zap, CheckCircle, Crown } from "lucide-react";
import { EnhancedPlatformData, EnhancedClientData } from "./types/enhanced-types";
import { CampaignDetailsTooltip } from "./CampaignDetailsTooltip";

interface EnhancedHealthTableProps {
  data?: EnhancedClientData[];
  isLoading: boolean;
  error?: string | null;
  handleAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
}

function EnhancedPlatformCell({ 
  platformAccounts, 
  platformName, 
  platformKey, 
  clientId, 
  clientName,
  onAction 
}: { 
  platformAccounts?: EnhancedPlatformData[];
  platformName: string;
  platformKey: 'meta' | 'google';
  clientId: string;
  clientName: string;
  onAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
}) {
  if (!platformAccounts || platformAccounts.length === 0) {
    return (
      <TableCell className="py-4 w-[382px] align-top">
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 h-full">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Não configurado</span>
            <Badge variant="outline" className="text-xs">Setup</Badge>
          </div>
          <p className="text-xs text-gray-400">Conectar conta para monitoramento</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('configure', clientId, platformKey)}
            className="w-full h-7 text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Configurar
          </Button>
        </div>
      </TableCell>
    );
  }

  const getAlertStyling = (alertLevel: string) => {
    switch (alertLevel) {
      case 'critical':
        return {
          cardClasses: 'border-red-200 bg-red-50',
          textClass: 'text-red-700 font-semibold',
          label: 'Crítico'
        };
      case 'high':
        return {
          cardClasses: 'border-orange-200 bg-orange-50',
          textClass: 'text-orange-700 font-semibold',
          label: 'Alto'
        };
      case 'medium':
        return {
          cardClasses: 'border-yellow-200 bg-yellow-50',
          textClass: 'text-yellow-700 font-semibold',
          label: 'Médio'
        };
      case 'ok':
        return {
          cardClasses: 'border-green-200 bg-green-50',
          textClass: 'text-green-700 font-semibold',
          label: 'OK'
        };
      default:
        return {
          cardClasses: 'border-gray-200 bg-gray-50',
          textClass: 'text-gray-600',
          label: 'Indefinido'
        };
    }
  };

  const getStatusIconComponent = (alertLevel: string) => {
    switch (alertLevel) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'ok': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <TableCell className="py-4 w-[382px] align-top">
      <div className="space-y-2">
        {platformAccounts.map((account, index) => {
          const alertStyling = getAlertStyling(account.alertLevel);
          
          return (
            <div 
              key={`${account.accountId}-${index}`} 
              className={`rounded-lg p-3 border ${alertStyling.cardClasses} ${index > 0 ? 'mt-2' : ''}`}
            >
              {/* Header com Status e indicador de conta principal */}
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-2 ${alertStyling.textClass}`}>
                  {getStatusIconComponent(account.alertLevel)}
                  <span className="text-xs font-medium">
                    {alertStyling.label}
                  </span>
                  {account.isPrimary && (
                    <Crown className="w-3 h-3 text-yellow-600" />
                  )}
                </div>
              </div>

              {/* Nome e ID da conta */}
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {account.accountName || 'Nome não disponível'}
                </p>
                <p className="text-xs text-gray-500">
                  ID: {account.accountId}
                </p>
              </div>

              {/* Métricas compactas com tooltips */}
              <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                <CampaignDetailsTooltip
                  campaigns={account.campaignsDetailed || []}
                  title="Campanhas Ativas"
                  platform={platformName}
                >
                  <div className="bg-white rounded p-1 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="font-medium text-gray-800">{account.activeCampaignsCount}</div>
                    <div className="text-gray-500 text-xs">Ativas</div>
                  </div>
                </CampaignDetailsTooltip>
                
                <CampaignDetailsTooltip
                  campaigns={account.campaignsDetailed?.filter(c => c.impressions === 0 && c.cost === 0) || []}
                  title="Campanhas Sem Veiculação"
                  platform={platformName}
                >
                  <div className="bg-white rounded p-1 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`font-medium ${account.unservedCampaignsCount > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                      {account.unservedCampaignsCount}
                    </div>
                    <div className="text-gray-500 text-xs">S/ veic.</div>
                  </div>
                </CampaignDetailsTooltip>
                
                <div className="bg-white rounded p-1">
                  <div className={`font-medium text-xs ${account.costToday > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    R$ {account.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-gray-500 text-xs">Gasto</div>
                </div>
                <div className="bg-white rounded p-1">
                  <div className={`font-medium text-xs ${account.impressionsToday > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {account.impressionsToday.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-gray-500 text-xs">Impr.</div>
                </div>
              </div>

              {/* Problema principal */}
              {account.problems.length > 0 && (
                <div className="text-xs text-gray-700 font-medium mb-2">
                  {account.problems[0].description}
                </div>
              )}

              {/* Botão de ação */}
              <Button
                variant="default"
                size="sm"
                onClick={() => onAction('review', clientId, platformKey)}
                className="w-full h-7 text-xs bg-[#ff6e00] hover:bg-[#e55a00]"
              >
                <Eye className="w-3 h-3 mr-1" />
                <span>Ver Detalhes</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          );
        })}
      </div>
    </TableCell>
  );
}

export function EnhancedHealthTable({
  data,
  isLoading,
  error,
  handleAction
}: EnhancedHealthTableProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Nenhum cliente encontrado com os filtros aplicados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="w-48 font-semibold text-gray-700">Cliente</TableHead>
                <TableHead className="w-[382px] text-center font-semibold text-gray-700">Meta Ads</TableHead>
                <TableHead className="w-[382px] text-center font-semibold text-gray-700">Google Ads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((client) => (
                <TableRow key={client.clientId} className="hover:bg-gray-50 transition-colors">
                  {/* Cliente */}
                  <TableCell className="py-4 align-top">
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{client.clientName}</p>
                      <div className="flex flex-col gap-1">
                        {client.metaAds && client.metaAds.length > 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            Meta: {client.metaAds.length} conta{client.metaAds.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {client.googleAds && client.googleAds.length > 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            Google: {client.googleAds.length} conta{client.googleAds.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Meta Ads */}
                  <EnhancedPlatformCell
                    platformAccounts={client.metaAds}
                    platformName="Meta"
                    platformKey="meta"
                    clientId={client.clientId}
                    clientName={client.clientName}
                    onAction={handleAction}
                  />
                  
                  {/* Google Ads */}
                  <EnhancedPlatformCell
                    platformAccounts={client.googleAds}
                    platformName="Google"
                    platformKey="google"
                    clientId={client.clientId}
                    clientName={client.clientName}
                    onAction={handleAction}
                  />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
