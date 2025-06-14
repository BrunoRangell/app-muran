
import { ClientsDashboard } from "@/components/clients/dashboard/ClientsDashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/clients/types";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { ClientsLoadingState } from "@/components/loading-states/ClientsLoadingState";

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

  return <ClientsDashboard />;
};

export default Clients;
