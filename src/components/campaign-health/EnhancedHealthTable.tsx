
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, Settings, ExternalLink, AlertTriangle, Zap, CheckCircle } from "lucide-react";
import { EnhancedPlatformData } from "./types/enhanced-types";

interface EnhancedClientData {
  clientId: string;
  clientName: string;
  metaAds?: EnhancedPlatformData;
  googleAds?: EnhancedPlatformData;
  overallStatus: string;
}

interface EnhancedHealthTableProps {
  data?: EnhancedClientData[];
  isLoading: boolean;
  error?: string | null;
  handleAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
}

function EnhancedPlatformCell({ 
  platformData, 
  platformName, 
  platformKey, 
  clientId, 
  onAction 
}: { 
  platformData?: EnhancedPlatformData;
  platformName: string;
  platformKey: 'meta' | 'google';
  clientId: string;
  onAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
}) {
  if (!platformData) {
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
      case 'critical': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'high': return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'medium': return <Zap className="w-6 h-6 text-yellow-600" />;
      case 'ok': return <CheckCircle className="w-6 h-6 text-green-600" />;
      default: return <div className="w-6 h-6 rounded-full bg-gray-300" />;
    }
  };
  
  const alertStyling = getAlertStyling(platformData.alertLevel);

  return (
    <TableCell className="py-4 w-[382px] align-top">
      <div className={`rounded-lg p-3 space-y-3 border ${alertStyling.cardClasses} h-full`}>
        {/* Header com Status */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${alertStyling.textClass}`}>
            {getStatusIconComponent(platformData.alertLevel)}
            <span className="text-sm">
              {alertStyling.label}
            </span>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded p-2">
            <div className="font-medium text-gray-800">{platformData.activeCampaignsCount}</div>
            <div className="text-gray-500">Campanhas ativas</div>
          </div>
          <div className="bg-white rounded p-2">
            <div className={`font-medium ${platformData.unservedCampaignsCount > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
              {platformData.unservedCampaignsCount}
            </div>
            <div className={`text-gray-500 ${platformData.unservedCampaignsCount > 0 ? 'text-orange-700' : ''}`}>Sem veiculação</div>
          </div>
          <div className="bg-white rounded p-2">
            <div className={`font-medium ${platformData.costToday > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              R$ {platformData.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-gray-500">Gasto hoje</div>
          </div>
          <div className="bg-white rounded p-2">
            <div className={`font-medium ${platformData.impressionsToday > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {platformData.impressionsToday.toLocaleString('pt-BR')}
            </div>
            <div className="text-gray-500">Impressões</div>
          </div>
        </div>

        {/* Problema */}
        {platformData.problems.length > 0 && (
          <div className="text-xs text-gray-700 font-medium pt-1">
            {platformData.problems[0].description}
          </div>
        )}

        {/* Botão de Ação */}
        <div className="flex gap-2 pt-1">
           <Button
            variant="default"
            size="sm"
            onClick={() => onAction('review', clientId, platformKey)}
            className="flex-1 h-8 text-xs bg-[#ff6e00] hover:bg-[#e55a00]"
          >
            <Eye />
            <span>Ver Detalhes</span>
            <ExternalLink />
          </Button>
        </div>
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
                      <div className="flex gap-1">
                        {client.metaAds && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            Meta: {client.metaAds.accountId}
                          </Badge>
                        )}
                        {client.googleAds && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            Google: {client.googleAds.accountId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Meta Ads */}
                  <EnhancedPlatformCell
                    platformData={client.metaAds}
                    platformName="Meta"
                    platformKey="meta"
                    clientId={client.clientId}
                    onAction={handleAction}
                  />
                  
                  {/* Google Ads */}
                  <EnhancedPlatformCell
                    platformData={client.googleAds}
                    platformName="Google"
                    platformKey="google"
                    clientId={client.clientId}
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
