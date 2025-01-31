import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const FinancialMetrics = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["clientMetrics"],
    queryFn: async () => {
      console.log("Fetching client metrics...");
      const { data: clients, error } = await supabase
        .from("clients")
        .select("contract_value, status");

      if (error) {
        console.error("Error fetching client metrics:", error);
        throw error;
      }

      const totalClients = clients.length;
      const monthlyRevenue = clients.reduce((sum, client) => {
        return sum + (client.contract_value || 0);
      }, 0);
      const averageTicket = totalClients > 0 ? monthlyRevenue / totalClients : 0;

      console.log("Client metrics calculated:", { totalClients, monthlyRevenue, averageTicket });
      return { totalClients, monthlyRevenue, averageTicket };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Métricas Financeiras</h2>
      
      {isLoading ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <Users className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total de Clientes
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {metrics?.totalClients || 0}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Faturamento Mensal
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatCurrency(metrics?.monthlyRevenue || 0)}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <CreditCard className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Ticket Médio
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatCurrency(metrics?.averageTicket || 0)}
                </h3>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};