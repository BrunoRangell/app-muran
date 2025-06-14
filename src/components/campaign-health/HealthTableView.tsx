
import { useActiveCampaignHealth } from "./hooks/useActiveCampaignHealth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CompactStatusIndicator } from "./CompactStatusIndicator";
import { PlatformDataCell } from "./PlatformDataCell";
import { MoreVertical, ExternalLink, Settings, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function HealthTableView() {
  const {
    data,
    isLoading,
    error,
    handleAction
  } = useActiveCampaignHealth();

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
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
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
                <TableHead className="w-64 font-semibold text-gray-700">Cliente</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Meta Ads</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Google Ads</TableHead>
                <TableHead className="w-20 text-center font-semibold text-gray-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((client) => (
                <TableRow key={client.clientId} className="hover:bg-gray-50 transition-colors">
                  {/* Cliente */}
                  <TableCell className="py-4">
                    <div>
                      <p className="font-medium text-gray-900">{client.clientName}</p>
                      <div className="flex gap-1 mt-1">
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
                  
                  {/* Status Geral */}
                  <TableCell className="text-center py-4">
                    <CompactStatusIndicator status={client.overallStatus} />
                  </TableCell>
                  
                  {/* Meta Ads */}
                  <PlatformDataCell
                    platformData={client.metaAds}
                    platformName="Meta"
                    platformKey="meta"
                    clientId={client.clientId}
                    onAction={handleAction}
                  />
                  
                  {/* Google Ads */}
                  <PlatformDataCell
                    platformData={client.googleAds}
                    platformName="Google"
                    platformKey="google"
                    clientId={client.clientId}
                    onAction={handleAction}
                  />
                  
                  {/* Ações */}
                  <TableCell className="text-center py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {client.metaAds && (
                          <>
                            <DropdownMenuItem onClick={() => handleAction('details', client.clientId, 'meta')}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Ver Meta Ads
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('review', client.clientId, 'meta')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Revisar Meta
                            </DropdownMenuItem>
                          </>
                        )}
                        {client.googleAds && (
                          <>
                            <DropdownMenuItem onClick={() => handleAction('details', client.clientId, 'google')}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Ver Google Ads
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('review', client.clientId, 'google')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Revisar Google
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleAction('configure', client.clientId, 'meta')}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurar Cliente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
