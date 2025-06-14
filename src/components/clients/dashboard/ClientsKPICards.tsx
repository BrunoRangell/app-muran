
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Clock } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Client } from "../types";
import { calculateRetention } from "../table/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsKPICardsProps {
  clients: Client[];
  isLoading: boolean;
}

export const ClientsKPICards = ({ clients, isLoading }: ClientsKPICardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const activeClients = clients.filter(client => client.status === 'active');
  const totalRevenue = activeClients.reduce((sum, client) => sum + client.contract_value, 0);
  const averageRetention = activeClients.length > 0 
    ? activeClients.reduce((sum, client) => sum + calculateRetention(client), 0) / activeClients.length 
    : 0;
  const totalClients = clients.length;

  const kpis = [
    {
      title: "Total de Clientes",
      value: totalClients.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+12% vs mês anterior"
    },
    {
      title: "Clientes Ativos",
      value: activeClients.length.toString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: `${((activeClients.length / totalClients) * 100).toFixed(1)}% do total`
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-muran-primary",
      bgColor: "bg-orange-50",
      trend: "+8% vs mês anterior"
    },
    {
      title: "Retenção Média",
      value: `${averageRetention.toFixed(1)} meses`,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "Acima da média do setor"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="p-6 hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
              <p className="text-2xl font-bold text-muran-dark">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.trend}</p>
            </div>
            <div className={`p-3 rounded-full ${kpi.bgColor}`}>
              <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
