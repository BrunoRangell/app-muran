
import { Card } from "@/components/ui/card";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsRanking } from "@/components/clients/rankings/ClientsRanking";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/clients/types";

const Clients = () => {
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("company_name");

      if (error) throw error;
      return data as Client[];
    }
  });

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
