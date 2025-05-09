
import { Card, CardContent } from "@/components/ui/card";
import { 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedMetrics } from "../hooks/useUnifiedReviewsData";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

interface MetricsPanelProps {
  metrics: UnifiedMetrics;
  onBatchReview: () => void;
  isProcessing: boolean;
  platform?: "meta" | "google";
}

const MetricCard = ({ title, value, icon, description }: MetricCardProps) => (
  <Card className="bg-white">
    <CardContent className="flex items-start p-4 md:p-5">
      <div className="bg-[#ff6e00]/10 p-3 rounded-full mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </CardContent>
  </Card>
);

export function MetricsPanel({ 
  metrics, 
  onBatchReview, 
  isProcessing,
  platform = "meta"
}: MetricsPanelProps) {
  const platformName = platform === "meta" ? "Meta Ads" : "Google Ads";
  const platformLabel = platform === "meta" ? "clientes" : "campanhas";
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#321e32]">
          Panorama do {platformName}
        </h2>
        <Button
          onClick={onBatchReview}
          disabled={isProcessing}
          className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-4 w-4" />
              Analisar Todos
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={`Total de ${platformLabel}`}
          value={metrics.totalItems || 0}
          icon={<CircleDollarSign className="h-6 w-6 text-[#ff6e00]" />}
          description={`${metrics.reviewedItems || 0} ${platformLabel} revisados hoje`}
        />
        <MetricCard
          title="Orçamentos a aumentar"
          value={metrics.increases || 0}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
        />
        <MetricCard
          title="Orçamentos a diminuir"
          value={metrics.decreases || 0}
          icon={<TrendingDown className="h-6 w-6 text-red-600" />}
        />
        <MetricCard
          title={`${platformLabel} com alertas`}
          value={metrics.issues || 0}
          icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
          description="Orçamentos que requerem atenção"
        />
      </div>
    </div>
  );
}
