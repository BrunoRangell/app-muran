
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert, Users, BarChartHorizontal } from "lucide-react";

interface MetricsCardsProps {
  totalClients: number;
  clientsWithAdjustments: number;
  adjustmentPercentage: number;
}

export const MetricsCards = ({
  totalClients,
  clientsWithAdjustments,
  adjustmentPercentage
}: MetricsCardsProps) => {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClients}</div>
          <p className="text-xs text-muted-foreground">
            Clientes com contas Meta configuradas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Necessitam Ajustes</CardTitle>
          <CircleAlert className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clientsWithAdjustments}</div>
          <p className="text-xs text-muted-foreground">
            Clientes com diferenças de orçamento significativas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Percentual de Ajustes</CardTitle>
          <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adjustmentPercentage}%</div>
          <div className="h-2 w-full bg-gray-100 mt-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full" 
              style={{ width: `${adjustmentPercentage}%` }} 
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
