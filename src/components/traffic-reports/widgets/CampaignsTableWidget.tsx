import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpa: number;
  platform?: string;
}

interface CampaignsTableWidgetProps {
  campaigns: Campaign[];
  limit?: number;
  title?: string;
  showPlatformFilter?: boolean;
}

export function CampaignsTableWidget({ 
  campaigns, 
  limit = 10,
  title 
}: CampaignsTableWidgetProps) {
  const displayCampaigns = campaigns?.slice(0, limit) || [];

  if (displayCampaigns.length === 0) {
    return (
      <Card className="glass-card h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados de campanhas</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-full w-full overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}
      <div className="h-full w-full overflow-auto p-3">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Campanha</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Impressões</TableHead>
              <TableHead className="text-xs text-right">Cliques</TableHead>
              <TableHead className="text-xs text-right">CTR</TableHead>
              <TableHead className="text-xs text-right">Conversões</TableHead>
              <TableHead className="text-xs text-right">Investimento</TableHead>
              <TableHead className="text-xs text-right">CPA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayCampaigns.map((campaign) => (
              <TableRow key={campaign.id} className="hover:bg-muted/50">
                <TableCell className="text-xs font-medium max-w-[200px] truncate">
                  {campaign.name}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    campaign.status === 'ACTIVE' 
                      ? "bg-green-500/10 text-green-600" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {campaign.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-right">
                  {campaign.impressions.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {campaign.clicks.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {campaign.ctr.toFixed(2)}%
                </TableCell>
                <TableCell className="text-xs text-right">
                  {campaign.conversions.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs text-right">
                  R$ {campaign.spend.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-right">
                  R$ {campaign.cpa.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
