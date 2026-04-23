import { PremiumKpiWidget } from '@/components/traffic-reports/widgets/PremiumKpiWidget';
import { MetricKey } from '@/types/template-editor';
import { mockOverview } from '@/data/mockPreviewData';

interface PremiumKpiPreviewProps {
  metric?: MetricKey;
  accent?: string;
}

export function PremiumKpiPreview({ metric = 'impressions', accent = '#ff6e00' }: PremiumKpiPreviewProps) {
  return (
    <div className="h-full p-2" style={{ background: '#0B0F1A' }}>
      <PremiumKpiWidget
        metric={metric}
        accent={accent}
        showComparison
        data={{
          current: mockOverview[metric],
          previous: mockOverview[metric] * 0.85,
          change: 12.5,
        }}
      />
    </div>
  );
}
