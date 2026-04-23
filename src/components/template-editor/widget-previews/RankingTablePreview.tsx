import { RankingTableWidget } from '@/components/traffic-reports/widgets/RankingTableWidget';
import { MetricKey, RankingDataSource } from '@/types/template-editor';
import { mockDemographics, mockCampaigns, mockCreatives } from '@/data/mockPreviewData';

interface RankingTablePreviewProps {
  dataSource?: RankingDataSource;
  metric?: MetricKey;
  accent?: string;
  limit?: number;
}

export function RankingTablePreview({
  dataSource = 'regions',
  metric = 'conversions',
  accent = '#ff6e00',
  limit = 8,
}: RankingTablePreviewProps) {
  return (
    <div className="h-full p-2" style={{ background: '#0B0F1A' }}>
      <RankingTableWidget
        dataSource={dataSource}
        metric={metric}
        accent={accent}
        limit={limit}
        demographics={mockDemographics}
        campaigns={mockCampaigns}
        topAds={mockCreatives}
      />
    </div>
  );
}
