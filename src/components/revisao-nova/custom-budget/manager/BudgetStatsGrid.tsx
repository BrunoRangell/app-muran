
import { Card, CardContent } from "@/components/ui/card";

interface BudgetStats {
  total: number;
  active: number;
  scheduled: number;
  meta: number;
  google: number;
}

interface BudgetStatsGridProps {
  stats: BudgetStats;
}

export const BudgetStatsGrid = ({ stats }: BudgetStatsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
      <Card className="bg-gray-50 border-none">
        <CardContent className="p-4 flex flex-col items-center">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-xl font-bold">{stats.total}</span>
        </CardContent>
      </Card>
      <Card className="bg-gray-50 border-none">
        <CardContent className="p-4 flex flex-col items-center">
          <span className="text-sm text-gray-500">Ativos</span>
          <span className="text-xl font-bold text-green-600">{stats.active}</span>
        </CardContent>
      </Card>
      <Card className="bg-gray-50 border-none">
        <CardContent className="p-4 flex flex-col items-center">
          <span className="text-sm text-gray-500">Agendados</span>
          <span className="text-xl font-bold text-blue-600">{stats.scheduled}</span>
        </CardContent>
      </Card>
      <Card className="bg-gray-50 border-none">
        <CardContent className="p-4 flex flex-col items-center">
          <span className="text-sm text-gray-500">Meta Ads</span>
          <span className="text-xl font-bold text-blue-600">{stats.meta}</span>
        </CardContent>
      </Card>
      <Card className="bg-gray-50 border-none">
        <CardContent className="p-4 flex flex-col items-center">
          <span className="text-sm text-gray-500">Google Ads</span>
          <span className="text-xl font-bold text-red-600">{stats.google}</span>
        </CardContent>
      </Card>
    </div>
  );
};
