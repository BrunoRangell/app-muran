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
import { MetricKey, DimensionKey, METRIC_LABELS } from '@/types/template-editor';

interface DataItem {
  id: string;
  name: string;
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr?: number;
  conversions?: number;
  spend?: number;
  cpa?: number;
  cpc?: number;
  [key: string]: any;
}

interface SimpleTableWidgetProps {
  data: DataItem[];
  dimension?: DimensionKey;
  metrics?: MetricKey[];
  limit?: number;
  title?: string;
}

// Formatar valor baseado no tipo de métrica
const formatValue = (key: MetricKey, value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  
  switch (key) {
    case 'impressions':
    case 'reach':
    case 'clicks':
    case 'conversions':
      return value.toLocaleString('pt-BR');
    case 'spend':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    case 'ctr':
      return `${value.toFixed(2)}%`;
    case 'cpa':
    case 'cpc':
      return `R$ ${value.toFixed(2)}`;
    default:
      return value.toString();
  }
};

export function SimpleTableWidget({ 
  data, 
  dimension = 'campaigns',
  metrics = ['impressions', 'clicks', 'ctr'],
  limit = 10,
  title 
}: SimpleTableWidgetProps) {
  const displayData = data?.slice(0, limit) || [];
  
  // Filtrar métricas para exibir apenas as que existem nos dados
  const validMetrics = metrics.filter(metric => 
    displayData.some(item => item[metric] !== undefined)
  );

  if (displayData.length === 0) {
    return (
      <Card className="glass-card h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
      </Card>
    );
  }

  // Label para a primeira coluna baseado na dimensão
  const getDimensionLabel = () => {
    switch (dimension) {
      case 'campaigns': return 'Campanha';
      case 'creatives': return 'Criativo';
      case 'age': return 'Faixa Etária';
      case 'gender': return 'Gênero';
      case 'location': return 'Localização';
      default: return 'Nome';
    }
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
              <TableHead className="text-xs">{getDimensionLabel()}</TableHead>
              {validMetrics.map(metric => (
                <TableHead key={metric} className="text-xs text-right">
                  {METRIC_LABELS[metric]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((item, index) => (
              <TableRow key={item.id || index} className="hover:bg-muted/50">
                <TableCell className="text-xs font-medium max-w-[200px] truncate">
                  {item.name}
                </TableCell>
                {validMetrics.map(metric => (
                  <TableCell key={metric} className="text-xs text-right">
                    {formatValue(metric, item[metric])}
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
