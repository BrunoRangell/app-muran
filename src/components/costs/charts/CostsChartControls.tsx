import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, Download, RefreshCw } from "lucide-react";
import { Cost, CostFilters } from "@/types/cost";
import { CategoryPieChart } from "./CategoryPieChart";
import { MonthlyTrendChart } from "./MonthlyTrendChart";

interface CostsChartControlsProps {
  costs: Cost[];
  filters: CostFilters;
  onRefresh?: () => void;
}

export function CostsChartControls({ costs, filters, onRefresh }: CostsChartControlsProps) {

  const handleExport = () => {
    // TODO: Implementar exportação de gráficos
    console.log("Exportar gráficos");
  };

  const charts = [
    {
      id: "categories",
      title: "Distribuição por Categoria",
      icon: PieChart,
      content: <CategoryPieChart costs={costs} />
    },
    {
      id: "monthly",
      title: "Evolução Mensal",
      icon: BarChart3,
      content: <MonthlyTrendChart costs={costs} />
    }
  ];

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-end gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {charts.map((chart) => (
          <Card key={chart.id}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <chart.icon className="h-5 w-5" />
                {chart.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chart.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}