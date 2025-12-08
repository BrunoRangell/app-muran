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
import { cn } from '@/lib/utils';

interface TablePreviewProps {
  metrics?: MetricKey[];
  limit?: number;
}

export function TablePreview({ metrics = ['impressions', 'clicks', 'conversions'], limit = 5 }: TablePreviewProps) {
  const campaigns = mockCampaigns.slice(0, limit);

  return (
    <div className="h-full w-full overflow-auto p-2">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">Campanha</TableHead>
            {metrics.map(metric => (
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
              {metrics.map(metric => (
                <TableCell key={metric} className="text-xs text-right">
                  {formatMetricValue(metric, campaign[metric as keyof typeof campaign] as number)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
