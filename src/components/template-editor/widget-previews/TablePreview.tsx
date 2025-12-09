import React from 'react';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { mockCampaigns, formatMetricValue } from '@/data/mockPreviewData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TablePreviewProps {
  metrics?: MetricKey[];
  limit?: number;
}

// Métricas disponíveis nos dados de campanha
const AVAILABLE_CAMPAIGN_METRICS: MetricKey[] = ['impressions', 'clicks', 'conversions', 'spend', 'ctr', 'cpa'];

export function TablePreview({ metrics = ['impressions', 'clicks', 'conversions'], limit = 5 }: TablePreviewProps) {
  const campaigns = mockCampaigns.slice(0, limit);
  
  // Filtrar apenas métricas que existem nos dados de campanha
  const validMetrics = metrics.filter(m => AVAILABLE_CAMPAIGN_METRICS.includes(m));

  return (
    <div className="h-full w-full overflow-auto p-2">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">Campanha</TableHead>
            {validMetrics.map(metric => (
              <TableHead key={metric} className="text-xs text-right">
                {METRIC_LABELS[metric]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="hover:bg-muted/50">
              <TableCell className="text-xs font-medium max-w-[150px] truncate">
                {campaign.name}
              </TableCell>
              {validMetrics.map(metric => {
                const value = campaign[metric as keyof typeof campaign];
                return (
                  <TableCell key={metric} className="text-xs text-right">
                    {value !== undefined ? formatMetricValue(metric, value as number) : '-'}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
