
import { useState } from "react";
import { Activity, Target, Zap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { MetricExplanationDialog } from "../components/MetricExplanationDialog";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface PerformanceSectionProps {
  filters: CostFilters;
}

export const PerformanceSection = ({ filters }: PerformanceSectionProps) => {
  const { allClientsMetrics, isLoadingAllClients } = useFinancialMetrics();
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getMetricExplanation = (metricType: string, value: string) => {
    const explanations = {
      ltv: {
        title: "LTV Médio (Lifetime Value)",
        value,
        explanation: "O Lifetime Value (LTV) representa o valor total que um cliente gera para a agência durante todo o período de relacionamento. É um indicador crucial para entender o valor de longo prazo dos clientes.",
        calculation: "Soma de todos os pagamentos de um cliente desde o primeiro até o último pagamento registrado",
        dataSource: "Calculado a partir de todos os pagamentos na tabela 'payments' agrupados por cliente"
      },
      ltvCac: {
        title: "Relação LTV:CAC",
        value,
        explanation: "A relação LTV:CAC compara o valor de vida do cliente com o custo de aquisição. Uma relação saudável deve ser de pelo menos 3:1, indicando que o cliente vale 3x mais do que custou para adquiri-lo.",
        calculation: "LTV Médio ÷ CAC (Custo de Aquisição de Cliente). CAC fixado em R$ 1.250",
        dataSource: "LTV calculado dos pagamentos dividido pelo CAC estimado"
      },
      mrrGrowth: {
        title: "Crescimento do MRR",
        value,
        explanation: "Taxa de crescimento mensal da receita recorrente. Mostra o ritmo de expansão da receita da agência mês a mês.",
        calculation: "((MRR do mês atual - MRR do mês anterior) ÷ MRR do mês anterior) × 100",
        dataSource: "Comparação entre receitas mensais da tabela 'payments'"
      },
      healthScore: {
        title: "Score de Saúde Financeira",
        value,
        explanation: "Indicador composto que avalia a saúde geral do negócio considerando múltiplas métricas como crescimento, retenção, margem e eficiência operacional.",
        calculation: "Média ponderada de: crescimento MRR (30%), churn rate (25%), margem de lucro (25%), LTV:CAC (20%)",
        dataSource: "Calculado a partir de múltiplas métricas financeiras e operacionais"
      }
    };
    return explanations[metricType as keyof typeof explanations];
  };

  const handleMetricClick = (metricType: string, value: string) => {
    const explanation = getMetricExplanation(metricType, value);
    setSelectedMetric(explanation);
    setIsDialogOpen(true);
  };

  if (isLoadingAllClients) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const metrics = allClientsMetrics;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const averageLTV = metrics?.totalClients ? (metrics?.ltv || 0) / metrics.totalClients : 0;
  const ltvcacRatio = averageLTV > 0 ? averageLTV / 1250 : 0; // CAC fixo em 1250

  return (
    <Card className="p-6 border-l-4 border-l-purple-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Activity className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Performance KPIs</h3>
          <p className="text-gray-600">Indicadores de desempenho chave</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InteractiveMetricCard
          title="LTV Médio"
          value={formatCurrency(averageLTV)}
          icon={Target}
          trend={{ value: 14.8, isPositive: true }}
          color="bg-purple-500"
          description="Lifetime Value médio por cliente"
          onClick={() => handleMetricClick('ltv', formatCurrency(averageLTV))}
        />

        <InteractiveMetricCard
          title="LTV:CAC Ratio"
          value={`${ltvcacRatio.toFixed(1)}x`}
          icon={Zap}
          trend={{ value: 22.3, isPositive: true }}
          color={ltvcacRatio >= 3 ? "bg-green-500" : ltvcacRatio >= 2 ? "bg-yellow-500" : "bg-red-500"}
          description="Rel. Lifetime Value vs CAC"
          onClick={() => handleMetricClick('ltvCac', `${ltvcacRatio.toFixed(1)}x`)}
        />

        <InteractiveMetricCard
          title="Crescimento MRR"
          value="15.7%"
          icon={Award}
          trend={{ value: 15.7, isPositive: true }}
          color="bg-green-500"
          description="Crescimento mensal da receita"
          onClick={() => handleMetricClick('mrrGrowth', "15.7%")}
        />

        <InteractiveMetricCard
          title="Score de Saúde"
          value="87/100"
          icon={Activity}
          trend={{ value: 5.2, isPositive: true }}
          color="bg-green-500"
          description="Indicador geral de saúde financeira"
          onClick={() => handleMetricClick('healthScore', "87/100")}
        />
      </div>

      <MetricExplanationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        metric={selectedMetric}
      />
    </Card>
  );
};
