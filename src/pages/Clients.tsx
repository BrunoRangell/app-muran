
import { Card } from "@/components/ui/card";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsRanking } from "@/components/clients/rankings/ClientsRanking";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/clients/types";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { ClientsLoadingState } from "@/components/loading-states/ClientsLoadingState";
import { Suspense } from "react";

const Clients = () => {
  const { toast } = useToast();
  
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw new Error("Não foi possível carregar a lista de clientes");
      }

      if (!data) {
        throw new Error("Nenhum dado retornado");
      }

      return data as Client[];
    },
    meta: {
      onError: (error: Error) => {
        console.error("Erro na query de clientes:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar clientes",
          description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        });
      }
    }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
        <AlertCircle className="h-12 w-12" />
        <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
        <p className="text-center text-gray-600">
          Não foi possível carregar a lista de clientes.
          <br />
          Por favor, tente novamente mais tarde.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <ClientsLoadingState />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Lista de Clientes
        </h1>
      </div>

      <Card className="p-2 md:p-6">
        <ClientsList />
      </Card>

      <ClientsRanking clients={clients || []} />
    </div>
  );
};

export default Clients;
