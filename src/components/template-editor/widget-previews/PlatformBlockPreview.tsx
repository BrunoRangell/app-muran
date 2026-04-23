import { PlatformBlockWidget } from '@/components/traffic-reports/widgets/PlatformBlockWidget';
import { MetricKey } from '@/types/template-editor';
import { mockOverview, mockTimeSeries } from '@/data/mockPreviewData';

interface PlatformBlockPreviewProps {
  platform?: 'meta' | 'google';
  accent?: string;
  mainMetric?: MetricKey;
  sideMetrics?: MetricKey[];
  chartMetric?: MetricKey;
}

export function PlatformBlockPreview({
  platform = 'meta',
  accent,
  mainMetric = 'spend',
  sideMetrics = ['clicks', 'conversions', 'cpa'],
  chartMetric = 'spend',
}: PlatformBlockPreviewProps) {
  const overview: Record<string, { current: number; previous: number; change: number }> = {};
  (Object.keys(mockOverview) as MetricKey[]).forEach((k) => {
    overview[k] = { current: mockOverview[k], previous: mockOverview[k] * 0.9, change: 8 };
  });

  return (
    <div className="h-full p-2" style={{ background: '#0B0F1A' }}>
      <PlatformBlockWidget
        platform={platform}
        accent={accent}
        mainMetric={mainMetric}
        sideMetrics={sideMetrics}
        chartMetric={chartMetric}
        timeSeries={mockTimeSeries.slice(-14)}
        overview={overview}
      />
    </div>
  );
}
