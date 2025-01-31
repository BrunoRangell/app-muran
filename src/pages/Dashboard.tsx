import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

const Dashboard = () => {
  const [showAlert, setShowAlert] = useState(true);
  
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      console.log("Fetching clients for dashboard...");
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }
      
      console.log("Clients fetched:", data);
      return data || [];
    }
  });

  const totalClients = clients.length;
  const totalRevenue = clients.reduce((sum, client) => {
    return sum + (client.contract_value || 0);
  }, 0);

  const formattedRevenue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalRevenue);

  return (
    <div className="space-y-6">
      {showAlert && (
        <Alert className="relative">
          <AlertDescription>
            Bem-vindo ao seu dashboard! Aqui você encontrará um resumo das principais métricas e informações do seu negócio.
            Em breve, mais dados e gráficos serão adicionados para ajudar na gestão do seu negócio.
          </AlertDescription>
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-2 right-2 p-1 hover:bg-secondary rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}
      
      <h1 className="text-3xl font-bold text-muran-complementary">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muran-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muran-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedRevenue}</div>
            <p className="text-xs text-muted-foreground">
              Receita acumulada no mês
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;