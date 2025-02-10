
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsList } from "@/components/clients/ClientsList";
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";
import { Users, DollarSign } from "lucide-react";

const Clients = () => {
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Financeiro Muran
        </h1>
      </div>

      <Card className="p-2 md:p-6">
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList className="w-full md:w-auto flex flex-col md:flex-row gap-2 md:gap-0">
            <TabsTrigger value="metrics" className="flex items-center gap-2 w-full md:w-auto text-sm md:text-base">
              <DollarSign className="h-4 w-4" />
              Saúde Financeira
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2 w-full md:w-auto text-sm md:text-base">
              <Users className="h-4 w-4" />
              Lista de Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-4 md:mt-6">
            <FinancialMetrics />
          </TabsContent>

          <TabsContent value="list" className="mt-4 md:mt-6">
            <ClientsList />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Clients;
