
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface GoogleAdsClientsGridProps {
  clientsWithGoogleAdsId: any[];
  clientsWithoutGoogleAdsId: any[];
  processingClients: string[];
  onReviewClient: (clientId: string) => void;
  viewMode: string;
  onVerifyTokens: () => void;
  isTokenVerifying: boolean;
}

export const GoogleAdsClientsGrid = ({
  clientsWithGoogleAdsId,
  clientsWithoutGoogleAdsId,
  processingClients,
  onReviewClient,
  viewMode,
  onVerifyTokens,
  isTokenVerifying
}: GoogleAdsClientsGridProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#321e32]">
            Clientes Google Ads
          </h2>
          <p className="text-sm text-gray-500">
            {clientsWithGoogleAdsId.length + clientsWithoutGoogleAdsId.length} clientes encontrados
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onVerifyTokens} 
            disabled={isTokenVerifying}
            variant="outline"
            className="flex items-center gap-1"
          >
            {isTokenVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Verificar tokens</span>
              </>
            )}
          </Button>
          
          <Link to="/settings?tab=api">
            <Button 
              variant="default"
              className="bg-[#ff6e00] hover:bg-[#cc5800] text-white"
            >
              <Settings className="h-4 w-4 mr-1" />
              <span>Configurações</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <Table>
        <TableCaption>Clientes com Google Ads Id</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientsWithGoogleAdsId.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.company_name}</TableCell>
              <TableCell>
                {processingClients.includes(client.id) ? (
                  <Badge variant="secondary">Processando...</Badge>
                ) : (
                  <Badge variant="outline">Pronto</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  onClick={() => onReviewClient(client.id)}
                  disabled={processingClients.includes(client.id)}
                >
                  Revisar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Table>
        <TableCaption>Clientes sem Google Ads Id</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientsWithoutGoogleAdsId.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.company_name}</TableCell>
              <TableCell>
                {processingClients.includes(client.id) ? (
                  <Badge variant="secondary">Processando...</Badge>
                ) : (
                  <Badge variant="outline">Pendente</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => onReviewClient(client.id)}
                  disabled={processingClients.includes(client.id)}
                >
                  Revisar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
