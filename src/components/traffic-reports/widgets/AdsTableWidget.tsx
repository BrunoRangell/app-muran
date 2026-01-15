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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

interface Ad {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  thumbnail?: string | null;
  status?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  cpc: number;
  spend: number;
}

interface AdsTableWidgetProps {
  ads: Ad[];
  limit?: number;
  title?: string;
  showThumbnails?: boolean;
  showProportionBars?: boolean;
  proportionMetric?: 'impressions' | 'clicks' | 'conversions' | 'spend';
}

export function AdsTableWidget({ 
  ads, 
  limit = 10,
  title,
  showThumbnails = true,
  showProportionBars = true,
  proportionMetric = 'impressions'
}: AdsTableWidgetProps) {
  const displayAds = ads?.slice(0, limit) || [];
  const maxValue = Math.max(...displayAds.map(ad => ad[proportionMetric] || 0));

  if (displayAds.length === 0) {
    return (
      <Card className="glass-card h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados de anúncios</p>
      </Card>
    );
  }

  const getProportionWidth = (value: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

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
              {showThumbnails && <TableHead className="text-xs w-16">Preview</TableHead>}
              <TableHead className="text-xs">Anúncio</TableHead>
              <TableHead className="text-xs text-center">Plataforma</TableHead>
              <TableHead className="text-xs text-right">Impressões</TableHead>
              <TableHead className="text-xs text-right">Cliques</TableHead>
              <TableHead className="text-xs text-right">CTR</TableHead>
              <TableHead className="text-xs text-right">Conversões</TableHead>
              <TableHead className="text-xs text-right">Investimento</TableHead>
              <TableHead className="text-xs text-right">CPA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayAds.map((ad) => (
              <TableRow key={ad.id} className="hover:bg-muted/50">
                {showThumbnails && (
                  <TableCell className="p-2">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {ad.thumbnail ? (
                        <img 
                          src={ad.thumbnail} 
                          alt={ad.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-xs font-medium max-w-[200px]">
                  <div className="truncate">{ad.name}</div>
                  {showProportionBars && (
                    <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-muran-primary rounded-full transition-all duration-300"
                        style={{ width: `${getProportionWidth(ad[proportionMetric] || 0)}%` }}
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-[10px] font-medium",
                      ad.platform === 'meta' 
                        ? "bg-blue-500/10 text-blue-600" 
                        : "bg-green-500/10 text-green-600"
                    )}
                  >
                    {ad.platform === 'meta' ? 'Meta' : 'Google'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-right">
                  {ad.impressions.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {ad.clicks.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {ad.ctr.toFixed(2)}%
                </TableCell>
                <TableCell className="text-xs text-right">
                  {ad.conversions.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-xs text-right">
                  R$ {ad.spend.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-right">
                  R$ {ad.cpa.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
