
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export const ClientsKPICards = () => {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["clients-kpis"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) throw error;

      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.status === 'active').length || 0;
      const totalMRR = clients
        ?.filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0;
      const churnRate = totalClients > 0 ? ((totalClients - activeClients) / totalClients * 100) : 0;

      return {
        totalClients,
        activeClients,
        totalMRR,
        churnRate
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total de Clientes",
      value: kpis?.totalClients || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+5% vs mês anterior"
    },
    {
      title: "Clientes Ativos",
      value: kpis?.activeClients || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: `${kpis?.activeClients || 0} de ${kpis?.totalClients || 0}`
    },
    {
      title: "MRR Total",
      value: formatCurrency(kpis?.totalMRR || 0),
      icon: DollarSign,
      color: "text-muran-primary",
      bgColor: "bg-orange-50",
      trend: "+12% vs mês anterior"
    },
    {
      title: "Taxa de Churn",
      value: `${kpis?.churnRate.toFixed(1) || 0}%`,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: "-2% vs mês anterior"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((kpi, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muran-dark mb-1">
              {kpi.value}
            </div>
            <p className="text-xs text-gray-500">
              {kpi.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
