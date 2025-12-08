import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Campaign {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  status: string;
  impressions: number;
  reach?: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  spend: number;
}

interface CampaignsInsightsTableProps {
  campaigns: Campaign[];
  accountId?: string;
  showPlatformFilter?: boolean;
}

export function CampaignsInsightsTable({ campaigns, accountId, showPlatformFilter = false }: CampaignsInsightsTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Campaign>("spend");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google'>('all');

  const filteredCampaigns = campaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(search.toLowerCase()) &&
      (platformFilter === 'all' || campaign.platform === platformFilter)
    )
    .sort((a, b) => {
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const handleSort = (field: keyof Campaign) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(Math.round(value));

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      'active': { label: 'Ativa', variant: 'default' },
      'enabled': { label: 'Ativa', variant: 'default' },
      'paused': { label: 'Pausada', variant: 'secondary' },
      'archived': { label: 'Arquivada', variant: 'outline' }
    };

    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const openInPlatform = (campaign: Campaign) => {
    if (campaign.platform === 'meta' && accountId) {
      window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountId}`, '_blank');
    } else if (campaign.platform === 'google') {
      window.open('https://ads.google.com/aw/campaigns', '_blank');
    }
  };

  return (
    <Card className="glass-card p-6 space-y-4 border border-border/30">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Campanhas Detalhadas</h2>
        <div className="flex items-center gap-3">
          {/* Filtro de plataforma */}
          {showPlatformFilter && (
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
              <button
                onClick={() => setPlatformFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  platformFilter === 'all' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setPlatformFilter('meta')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  platformFilter === 'meta' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                Meta
              </button>
              <button
                onClick={() => setPlatformFilter('google')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  platformFilter === 'google' 
                    ? 'bg-yellow-500 text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                Google
              </button>
            </div>
          )}
          
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campanha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('impressions')}>
                <div className="flex items-center justify-end gap-1">
                  Impressões
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('clicks')}>
                <div className="flex items-center justify-end gap-1">
                  Cliques
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('ctr')}>
                <div className="flex items-center justify-end gap-1">
                  CTR
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('conversions')}>
                <div className="flex items-center justify-end gap-1">
                  Conversões
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('cpa')}>
                <div className="flex items-center justify-end gap-1">
                  CPA
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('spend')}>
                <div className="flex items-center justify-end gap-1">
                  Investimento
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Nenhuma campanha encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => (
                <TableRow key={`${campaign.platform}-${campaign.id}`}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {campaign.name}
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={
                        campaign.platform === 'meta' 
                          ? 'border-blue-500/50 text-blue-600 bg-blue-500/10' 
                          : 'border-yellow-500/50 text-yellow-600 bg-yellow-500/10'
                      }
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        campaign.platform === 'meta' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      {campaign.platform === 'meta' ? 'Meta' : 'Google'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                  <TableCell className="text-right">{campaign.ctr.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{formatNumber(campaign.conversions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(campaign.cpa)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(campaign.spend)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInPlatform(campaign)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Exibindo {filteredCampaigns.length} de {campaigns.length} campanhas
      </div>
    </Card>
  );
}
