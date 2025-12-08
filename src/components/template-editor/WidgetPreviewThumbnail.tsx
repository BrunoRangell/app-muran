import React from 'react';
import { WidgetType, PresetType } from '@/types/template-editor';
import {
  OverviewPreview,
  TrendsPreview,
  DemographicsPreview,
  TopCreativesPreview,
  CampaignsTablePreview,
  MetricCardPreview,
  ChartPreview,
  PieChartPreview,
  TablePreview
} from './widget-previews';

interface WidgetPreviewThumbnailProps {
  type: WidgetType | PresetType;
}

export function WidgetPreviewThumbnail({ type }: WidgetPreviewThumbnailProps) {
  const renderPreview = () => {
    switch (type) {
      // Presets
      case 'overview-full':
        return <OverviewPreview />;
      case 'trends-full':
        return <TrendsPreview />;
      case 'demographics-full':
        return <DemographicsPreview />;
      // Widgets individuais
      case 'campaigns-table':
        return <CampaignsTablePreview />;
      case 'top-creatives':
        return <TopCreativesPreview limit={3} />;
      case 'metric-card':
        return <MetricCardPreview metric="impressions" showComparison />;
      case 'line-chart':
        return <ChartPreview chartType="line" metrics={['impressions', 'clicks']} showLegend />;
      case 'bar-chart':
        return <ChartPreview chartType="bar" metrics={['conversions']} showLegend />;
      case 'area-chart':
        return <ChartPreview chartType="area" metrics={['spend']} showLegend />;
      case 'pie-chart':
        return <PieChartPreview dataSource="demographics" showLegend />;
      case 'simple-table':
        return <TablePreview metrics={['impressions', 'clicks', 'conversions']} limit={5} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-[320px] h-[200px] overflow-hidden rounded-lg border border-border bg-card">
      <div className="transform scale-[0.5] origin-top-left w-[640px] h-[400px] pointer-events-none">
        {renderPreview()}
      </div>
    </div>
  );
}
