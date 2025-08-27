import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, BarChart3, PieChart, Download, RefreshCw } from "lucide-react";
import { Cost, CostFilters } from "@/types/cost";
import { CategoryPieChart } from "./CategoryPieChart";
import { MonthlyTrendChart } from "./MonthlyTrendChart";

interface CostsChartControlsProps {
  costs: Cost[];
  filters: CostFilters;
  onRefresh?: () => void;
}

type ChartLayout = "stacked" | "grid";

export function CostsChartControls({ costs, filters, onRefresh }: CostsChartControlsProps) {
  const [layout, setLayout] = useState<ChartLayout>("stacked");

  const handleExport = () => {
    // TODO: Implementar exportação de gráficos
    console.log("Exportar gráficos");
  };

  const renderCharts = () => {
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

    if (layout === "grid") {
      return (
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
      );
    }

    return (
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {charts.map((chart) => (
            <TabsTrigger key={chart.id} value={chart.id} className="flex items-center gap-2">
              <chart.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{chart.title}</span>
              <span className="sm:hidden">{chart.title.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {charts.map((chart) => (
          <TabsContent key={chart.id} value={chart.id} className="mt-6">
            <Card>
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
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={layout === "stacked" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("stacked")}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Empilhado</span>
          </Button>
          <Button
            variant={layout === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("grid")}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Grade</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Gráficos */}
      {renderCharts()}
    </div>
  );
}