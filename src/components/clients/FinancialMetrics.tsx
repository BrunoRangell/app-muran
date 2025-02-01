import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, CreditCard, Clock, Percent, BarChart, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";

export const FinancialMetrics = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["clientMetrics"],
    queryFn: async () => {
      console.log("Fetching client metrics...");
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching client metrics:", error);
        throw error;
      }

      return calculateFinancialMetrics(clients);
    },
  });

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
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Métricas Financeiras</h2>
      
      {isLoading ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  MRR
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatCurrency(metrics?.mrr || 0)}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <BarChart className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  ARR
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatCurrency(metrics?.arr || 0)}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <Calendar className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Retenção Média
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatDecimal(metrics?.averageRetention || 0)} meses
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <Percent className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Churn Rate
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatDecimal(metrics?.churnRate || 0)}%
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
                  LTV
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatCurrency(metrics?.ltv || 0)}
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-muran-primary/10 rounded-full">
                <Clock className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Payback Time
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatDecimal(metrics?.paybackTime || 0)} meses
                </h3>
              </div>
            </div>
          </Card>

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
                <CreditCard className="h-6 w-6 text-muran-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Ticket Médio
                </p>
                <h3 className="text-2xl font-bold text-muran-dark">
                  {formatCurrency((metrics?.mrr || 0) / (metrics?.activeClientsCount || 1))}
                </h3>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};