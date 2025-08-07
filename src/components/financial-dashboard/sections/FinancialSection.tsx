
import { useState } from "react";
import { DollarSign, TrendingUp, PieChart, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { MetricExplanationDialog } from "../components/MetricExplanationDialog";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface FinancialSectionProps {
  filters: CostFilters;
}

export const FinancialSection = ({ filters }: FinancialSectionProps) => {
  const { allClientsMetrics, isLoadingAllClients } = useFinancialMetrics();
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getMetricExplanation = (metricType: string, value: string) => {
    const explanations = {
      mrr: {
        title: "Receita Mensal Recorrente (MRR)",
        value,
        explanation: "A Receita Mensal Recorrente (MRR) representa o total de receita que a agência recebe mensalmente de forma previsível. É calculada com base nos pagamentos reais recebidos dos clientes.",
        calculation: "Soma de todos os pagamentos registrados na tabela 'payments' para o mês em questão. Considera apenas pagamentos efetivamente recebidos.",
        dataSource: "Tabela 'payments' - campo 'amount' filtrado por 'reference_month'"
      },
      avgTicket: {
        title: "Ticket Médio",
        value,
        explanation: "O Ticket Médio representa o valor médio pago por cliente ativo. É um indicador importante para entender o valor médio dos contratos.",
        calculation: "MRR total ÷ Número total de clientes ativos no período",
        dataSource: "Calculado a partir da receita total e número de clientes ativos"
      },
      netProfit: {
        title: "Lucro Líquido",
        value,
        explanation: "O Lucro Líquido é a diferença entre a receita total e todos os custos operacionais da agência. Mostra quanto dinheiro sobra após pagar todas as despesas.",
        calculation: "Receita Total (MRR) - Custos Totais (soma de todos os custos registrados)",
        dataSource: "Receita da tabela 'payments' menos custos da tabela 'costs'"
      },
      profitMargin: {
        title: "Margem de Lucro",
        value,
        explanation: "A Margem de Lucro é um percentual que mostra qual porcentagem da receita se converte em lucro. É um indicador chave da eficiência financeira.",
        calculation: "(Lucro Líquido ÷ Receita Total) × 100",
        dataSource: "Calculado a partir do lucro líquido e receita total"
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
  const profit = (metrics?.mrr || 0) - (metrics?.totalCosts || 0);
  const marginProfit = metrics?.mrr ? (profit / metrics.mrr) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <Card className="p-6 border-l-4 border-l-muran-primary">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-muran-primary/10 rounded-lg">
          <DollarSign className="h-5 w-5 text-muran-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Métricas Financeiras</h3>
          <p className="text-gray-600">Receitas, lucros e indicadores financeiros</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InteractiveMetricCard
          title="Receita Mensal"
          value={formatCurrency(metrics?.mrr || 0)}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          color="bg-green-500"
          description="MRR total dos clientes ativos"
          onClick={() => handleMetricClick('mrr', formatCurrency(metrics?.mrr || 0))}
        />

        <InteractiveMetricCard
          title="Ticket Médio"
          value={formatCurrency(metrics?.averageTicket || 0)}
          icon={Target}
          trend={{ value: 8.3, isPositive: true }}
          color="bg-blue-500"
          description="Valor médio por cliente"
          onClick={() => handleMetricClick('avgTicket', formatCurrency(metrics?.averageTicket || 0))}
        />

        <InteractiveMetricCard
          title="Lucro Líquido"
          value={formatCurrency(profit)}
          icon={TrendingUp}
          trend={{ value: 15.2, isPositive: profit >= 0 }}
          color={profit >= 0 ? "bg-green-500" : "bg-red-500"}
          description="Receita menos custos totais"
          onClick={() => handleMetricClick('netProfit', formatCurrency(profit))}
        />

        <InteractiveMetricCard
          title="Margem de Lucro"
          value={`${formatDecimal(marginProfit)}%`}
          icon={PieChart}
          trend={{ value: 3.1, isPositive: marginProfit >= 0 }}
          color={marginProfit >= 20 ? "bg-green-500" : marginProfit >= 10 ? "bg-yellow-500" : "bg-red-500"}
          description="Percentual do lucro sobre receita"
          onClick={() => handleMetricClick('profitMargin', `${formatDecimal(marginProfit)}%`)}
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
