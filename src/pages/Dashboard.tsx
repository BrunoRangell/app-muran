import { Card } from "@/components/ui/card";
import { 
  Users,
  TrendingUp,
  AlertCircle,
  DollarSign 
} from "lucide-react";

const stats = [
  {
    title: "Total de Clientes",
    value: "32",
    icon: Users,
    change: "+2 este mês",
    color: "bg-blue-500"
  },
  {
    title: "Faturamento Mensal",
    value: "R$ 48.250",
    icon: DollarSign,
    change: "+12% vs. último mês",
    color: "bg-green-500"
  },
  {
    title: "Taxa de Retenção",
    value: "94%",
    icon: TrendingUp,
    change: "-2% vs. último mês",
    color: "bg-muran-primary"
  },
  {
    title: "Clientes em Risco",
    value: "3",
    icon: AlertCircle,
    change: "+1 vs. último mês",
    color: "bg-red-500"
  }
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2 text-muran-dark">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Clientes Recentes</h2>
          <div className="space-y-4">
            {/* Placeholder para lista de clientes */}
            <p className="text-gray-600">Carregando clientes...</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Próximos Vencimentos</h2>
          <div className="space-y-4">
            {/* Placeholder para vencimentos */}
            <p className="text-gray-600">Carregando vencimentos...</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;