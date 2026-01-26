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
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';

interface Ad {
  id: string;
  name: string;
  platform: string;
  thumbnail?: string | null;
  status?: string;
  metrics: Partial<Record<MetricKey, number>>;
}

interface AdsTableWidgetProps {
  ads: Ad[];
  metrics?: MetricKey[];
  limit?: number;
  title?: string;
  showThumbnails?: boolean;
  showProportionBars?: boolean;
  proportionMetric?: MetricKey;
}

const formatMetricValue = (metric: MetricKey, value: number): string => {
  switch (metric) {
    case 'spend':
    case 'cpa':
    case 'cpc':
    case 'cpm':
      return `R$ ${value.toFixed(2)}`;
    case 'ctr':
      return `${value.toFixed(2)}%`;
    case 'frequency':
      return value.toFixed(1);
    default:
      return value.toLocaleString('pt-BR');
  }
};

export function AdsTableWidget({ 
  ads, 
  metrics = ['impressions', 'clicks', 'ctr', 'conversions', 'spend', 'cpa'],
  limit = 10,
  title,
  showThumbnails = true,
  showProportionBars = true,
  proportionMetric = 'impressions'
}: AdsTableWidgetProps) {
  const displayAds = ads?.slice(0, limit) || [];
  const maxValue = Math.max(...displayAds.map(ad => ad.metrics[proportionMetric] || 0));

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
              {metrics.map(metric => (
                <TableHead key={metric} className="text-xs text-right">
                  {METRIC_LABELS[metric]}
                </TableHead>
              ))}
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
                        style={{ width: `${getProportionWidth(ad.metrics[proportionMetric] || 0)}%` }}
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
                {metrics.map(metric => (
                  <TableCell key={metric} className="text-xs text-right">
                    {formatMetricValue(metric, ad.metrics[metric] || 0)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
