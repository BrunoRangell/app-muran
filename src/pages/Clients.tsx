import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsList } from "@/components/clients/ClientsList";
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";
import { Users, DollarSign } from "lucide-react";

const Clients = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Clientes</h1>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Métricas Financeiras
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lista de Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <FinancialMetrics />
          </TabsContent>

          <TabsContent value="list">
            <ClientsList />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Clients;