import { useState } from "react";
import { Cost, CostFilters } from "@/types/cost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Table as TableIcon, Eye, EyeOff } from "lucide-react";
import { CostsMetrics } from "@/components/costs/CostsMetrics";

interface CostsVisualizationProps {
  costs: Cost[];
  filters: CostFilters;
}

export function CostsVisualization({ costs, filters }: CostsVisualizationProps) {
  const [showCharts, setShowCharts] = useState(true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Visualizações
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
            className="gap-2"
          >
            {showCharts ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar Gráficos
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Mostrar Gráficos
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {showCharts && (
        <CardContent>
          <CostsMetrics costs={costs} filters={filters} />
        </CardContent>
      )}
    </Card>
  );
}